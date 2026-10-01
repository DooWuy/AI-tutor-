package com.vn.aitutor.service.impl;

import com.vn.aitutor.entity.ChatMessage;
import com.vn.aitutor.entity.ChatSession;
import com.vn.aitutor.entity.enums.SenderType;
import com.vn.aitutor.repository.ChatMessageRepository;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.agent.AiTutorChatAgent;
import com.vn.aitutor.service.IChatService;
import com.vn.aitutor.context.RagContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements IChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AiTutorChatAgent aiTutorChatAgent;
    
    // Use a shared cached thread pool for all SSE connections
    private final ExecutorService sseExecutor = Executors.newCachedThreadPool();

    @Override
    @Transactional
    public SseEmitter streamChatWithAI(UUID studentId, UUID sessionId, String userMessage) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Chat session not found"));

        // 1. Save user message
        ChatMessage studentMsg = new ChatMessage();
        studentMsg.setChatSession(session);
        studentMsg.setSenderType(SenderType.STUDENT);
        studentMsg.setContent(userMessage);
        chatMessageRepository.save(studentMsg);
        
        session.setLastMessageAt(Instant.now());
        chatSessionRepository.save(session);

        // 2. Setup SSE Emitter (Timeout 2 minutes)
        SseEmitter emitter = new SseEmitter(120000L);

        // 3. Start Streaming AI Response via LangChain4j Agent
        String subject = session.getSubject();
        String gradeLevel = session.getStudent() != null ? session.getStudent().getGradeLevel() : null;

        sseExecutor.submit(() -> {
            try {
                // Set thread-local context before RAG retrieval
                RagContextHolder.setContext(subject, gradeLevel);
                
                String fullResponse = aiTutorChatAgent.chat(sessionId.toString(), userMessage);
                
                // Simulate streaming by sending chunks of words
                String[] words = fullResponse.split("(?<=\\s)");
                for (String word : words) {
                    emitter.send(SseEmitter.event().name("message").data(word));
                    Thread.sleep(50); // Simulate typing delay
                }

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));

                // Save AI Message to DB
                ChatMessage aiMsg = new ChatMessage();
                aiMsg.setChatSession(session);
                aiMsg.setSenderType(SenderType.AI);
                aiMsg.setContent(fullResponse);
                chatMessageRepository.save(aiMsg);

                session.setLastMessageAt(Instant.now());
                chatSessionRepository.save(session);

                emitter.complete();
            } catch (Exception e) {
                log.error("AI Generation error", e);
                try {
                    emitter.send(SseEmitter.event().name("error").data("Lỗi kết nối AI"));
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    emitter.completeWithError(ex);
                }
            } finally {
                RagContextHolder.clearContext();
            }
        });

        // Setup emitter cleanup handlers
        emitter.onTimeout(emitter::complete);
        
        return emitter;
    }
}
