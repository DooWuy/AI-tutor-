package com.vn.aitutor.service.impl;

import com.vn.aitutor.entity.ChatMessage;
import com.vn.aitutor.entity.ChatSession;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.enums.SenderType;
import com.vn.aitutor.entity.enums.ChatSessionStatus;
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
import com.vn.aitutor.dto.response.ChatSessionResponse;
import com.vn.aitutor.dto.response.ChatMessageResponse;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.service.Result;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.vn.aitutor.service.ContentSafetyService;
import com.vn.aitutor.entity.AuditLog;
import com.vn.aitutor.repository.AuditLogRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements IChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AiTutorChatAgent aiTutorChatAgent;
    private final com.vn.aitutor.repository.StudentRepository studentRepository;
    private final ContentSafetyService contentSafetyService;
    private final AuditLogRepository auditLogRepository;
    
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
                // Content Safety Check (AC-04)
                if (!contentSafetyService.isSafe(userMessage)) {
                    // Log Audit
                    AuditLog auditLog = AuditLog.builder()
                            .userId(studentId)
                            .action("CONTENT_SAFETY_VIOLATION")
                            .details("Blocked unsafe message: " + userMessage)
                            .build();
                    auditLogRepository.save(auditLog);

                    String rejectionMessage = contentSafetyService.getRejectionMessage();

                    // Simulate streaming rejection message
                    String[] words = rejectionMessage.split("(?<=\\s)");
                    for (String word : words) {
                        emitter.send(SseEmitter.event().name("message").data(word));
                        Thread.sleep(50);
                    }
                    emitter.send(SseEmitter.event().name("done").data("[DONE]"));

                    // Save Rejection Message to DB
                    ChatMessage aiMsg = new ChatMessage();
                    aiMsg.setChatSession(session);
                    aiMsg.setSenderType(SenderType.AI);
                    aiMsg.setContent(rejectionMessage);
                    chatMessageRepository.save(aiMsg);

                    session.setLastMessageAt(Instant.now());
                    chatSessionRepository.save(session);

                    emitter.complete();
                    return; // Short-circuit, do not call LLM
                }

                // Set thread-local context before RAG retrieval
                RagContextHolder.setContext(subject, gradeLevel);
                
                Result<String> aiResult = aiTutorChatAgent.chat(sessionId.toString(), userMessage);
                String fullResponse = aiResult.content();
                
                // Simulate streaming by sending chunks of words
                String[] words = fullResponse.split("(?<=\\s)");
                for (String word : words) {
                    emitter.send(SseEmitter.event().name("message").data(word));
                    Thread.sleep(50); // Simulate typing delay
                }

                // Prepare citations
                List<Map<String, Object>> citations = new ArrayList<>();
                if (aiResult.sources() != null) {
                    for (Content content : aiResult.sources()) {
                        Map<String, Object> citation = new HashMap<>();
                        citation.put("text", content.textSegment().text());
                        citation.put("metadata", content.textSegment().metadata().toMap());
                        citations.add(citation);
                    }
                }

                // Also send citations as SSE event to the client
                emitter.send(SseEmitter.event().name("citations").data(citations));
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));

                // Save AI Message to DB
                ChatMessage aiMsg = new ChatMessage();
                aiMsg.setChatSession(session);
                aiMsg.setSenderType(SenderType.AI);
                aiMsg.setContent(fullResponse);
                if (!citations.isEmpty()) {
                    aiMsg.setCitationLinks(citations);
                }
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

    @Override
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getChatSessions(UUID userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found for user: " + userId));

        return chatSessionRepository.findChatSessionsByStudentIdDesc(student.getId()).stream()
                .map(session -> ChatSessionResponse.builder()
                        .id(session.getId())
                        .subject(session.getSubject())
                        .title(session.getTitle())
                        .status(session.getStatus() != null ? session.getStatus().name() : null)
                        .createdAt(session.getCreatedAt())
                        .lastMessageAt(session.getLastMessageAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatSessionMessages(UUID userId, UUID sessionId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found for user: " + userId));

        // Optionally verify if session belongs to student
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Chat session not found"));
        if (!session.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Access denied");
        }

        return chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(msg -> ChatMessageResponse.builder()
                        .id(msg.getId())
                        .senderType(msg.getSenderType() != null ? msg.getSenderType().name() : null)
                        .content(msg.getContent())
                        .audioUrl(msg.getAudioUrl())
                        .intent(msg.getIntent())
                        .citationLinks(msg.getCitationLinks())
                        .createdAt(msg.getCreatedAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public ChatSessionResponse createChatSession(UUID userId, String subject) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found for user: " + userId));
        
        ChatSession session = new ChatSession();
        session.setStudent(student);
        session.setSubject(subject);
        session.setTitle("Trò chuyện: " + subject);
        session.setStatus(ChatSessionStatus.OPEN);
        session.setCreatedAt(Instant.now());
        
        session = chatSessionRepository.save(session);
        
        return ChatSessionResponse.builder()
                .id(session.getId())
                .subject(session.getSubject())
                .title(session.getTitle())
                .status(session.getStatus() != null ? session.getStatus().name() : null)
                .createdAt(session.getCreatedAt())
                .lastMessageAt(session.getLastMessageAt())
                .build();
    }
}
