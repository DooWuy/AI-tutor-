package com.vn.aitutor.service;

import com.vn.aitutor.agent.AiTutorChatAgent;
import com.vn.aitutor.context.RagContextHolder;
import com.vn.aitutor.entity.AuditLog;
import com.vn.aitutor.entity.ChatMessage;
import com.vn.aitutor.entity.ChatSession;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.enums.SenderType;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.dto.response.ChatStreamEvent;
import com.vn.aitutor.repository.AuditLogRepository;
import com.vn.aitutor.repository.ChatMessageRepository;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.StudentRepository;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.service.Result;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatStreamProcessor {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final StudentRepository studentRepository;
    private final AiTutorChatAgent aiTutorChatAgent;
    private final ContentSafetyService contentSafetyService;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void process(UUID userId, UUID sessionId, String userMessage, Consumer<ChatStreamEvent> sink) {
        ChatSession session = requireOwnedSession(userId, sessionId);
        String normalizedMessage = requireMessage(userMessage);

        saveStudentMessage(session, normalizedMessage);

        try {
            if (!contentSafetyService.isSafe(normalizedMessage)) {
                processUnsafeMessage(userId, session, sink, normalizedMessage);
                return;
            }

            processSafeMessage(session, normalizedMessage, sink);
        } catch (Exception ex) {
            log.error("AI chat processing failed for session {}", sessionId, ex);
            sink.accept(ChatStreamEvent.error("Lỗi kết nối AI"));
        } finally {
            RagContextHolder.clearContext();
        }
    }

    private void saveStudentMessage(ChatSession session, String message) {
        ChatMessage studentMessage = new ChatMessage();
        studentMessage.setChatSession(session);
        studentMessage.setSenderType(SenderType.STUDENT);
        studentMessage.setContent(message);
        chatMessageRepository.save(studentMessage);

        session.setLastMessageAt(Instant.now());
        chatSessionRepository.save(session);
    }

    private void processUnsafeMessage(
            UUID userId,
            ChatSession session,
            Consumer<ChatStreamEvent> sink,
            String message) {
        auditLogRepository.save(AuditLog.builder()
                .userId(userId)
                .action("CONTENT_SAFETY_VIOLATION")
                .details("Blocked unsafe message: " + message)
                .build());

        String rejectionMessage = contentSafetyService.getRejectionMessage();
        emitChunks(rejectionMessage, sink);
        saveAiMessage(session, rejectionMessage, null);
        sink.accept(ChatStreamEvent.done());
    }

    private void processSafeMessage(
            ChatSession session,
            String message,
            Consumer<ChatStreamEvent> sink) {
        String subject = session.getSubject();
        String gradeLevel = session.getStudent() != null
                ? session.getStudent().getGradeLevel()
                : null;

        RagContextHolder.setContext(subject, gradeLevel);
        Result<String> aiResult = aiTutorChatAgent.chat(session.getId().toString(), message);
        String fullResponse = aiResult.content() == null ? "" : aiResult.content();
        emitChunks(fullResponse, sink);

        List<Map<String, Object>> citations = toCitations(aiResult);
        saveAiMessage(session, fullResponse, citations.isEmpty() ? null : citations);
        if (!citations.isEmpty()) {
            sink.accept(ChatStreamEvent.citations(citations));
        }
        sink.accept(ChatStreamEvent.done());
    }

    private void emitChunks(String content, Consumer<ChatStreamEvent> sink) {
        if (content == null || content.isEmpty()) {
            return;
        }
        for (String chunk : content.split("(?<=\\s)")) {
            sink.accept(ChatStreamEvent.token(chunk));
        }
    }

    private List<Map<String, Object>> toCitations(Result<String> aiResult) {
        List<Map<String, Object>> citations = new ArrayList<>();
        if (aiResult.sources() == null) {
            return citations;
        }
        for (Content content : aiResult.sources()) {
            Map<String, Object> citation = new HashMap<>();
            citation.put("text", content.textSegment().text());
            citation.put("metadata", content.textSegment().metadata().toMap());
            citations.add(citation);
        }
        return citations;
    }

    private void saveAiMessage(
            ChatSession session,
            String content,
            List<Map<String, Object>> citations) {
        ChatMessage aiMessage = new ChatMessage();
        aiMessage.setChatSession(session);
        aiMessage.setSenderType(SenderType.AI);
        aiMessage.setContent(content);
        if (citations != null && !citations.isEmpty()) {
            aiMessage.setCitationLinks(citations);
        }
        chatMessageRepository.save(aiMessage);
        session.setLastMessageAt(Instant.now());
        chatSessionRepository.save(session);
    }

    private Student requireStudent(UUID userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ học sinh"));
    }

    private ChatSession requireOwnedSession(UUID userId, UUID sessionId) {
        Student student = requireStudent(userId);
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên chat"));
        if (session.getStudent() == null || !student.getId().equals(session.getStudent().getId())) {
            throw new ResourceForbiddenException("Bạn không có quyền truy cập phiên chat này");
        }
        return session;
    }

    private String requireMessage(String message) {
        String normalized = message == null ? "" : message.trim();
        if (normalized.isEmpty()) {
            throw new ResourceBadRequestException("Tin nhắn không được để trống");
        }
        if (normalized.length() > 1000) {
            throw new ResourceBadRequestException("Tin nhắn không được vượt quá 1000 ký tự");
        }
        return normalized;
    }
}
