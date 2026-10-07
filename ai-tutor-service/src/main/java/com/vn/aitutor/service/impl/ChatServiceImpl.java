package com.vn.aitutor.service.impl;

import com.vn.aitutor.entity.ChatSession;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.enums.ChatSessionStatus;
import com.vn.aitutor.repository.ChatMessageRepository;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.service.IChatService;
import com.vn.aitutor.service.ChatStreamProcessor;
import com.vn.aitutor.dto.response.ChatStreamEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.persistence.EntityManager;
import com.vn.aitutor.dto.response.ChatSessionResponse;
import com.vn.aitutor.dto.response.ChatMessageResponse;

import java.util.*;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements IChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final com.vn.aitutor.repository.StudentRepository studentRepository;
    private final EntityManager entityManager;
    private final ChatStreamProcessor chatStreamProcessor;
    private final SimpMessagingTemplate simpMessagingTemplate;
    
    // Use a shared cached thread pool for all SSE connections
    private final ExecutorService sseExecutor = Executors.newCachedThreadPool();

    @Override
    @Transactional
    public SseEmitter streamChatWithAI(UUID studentId, UUID sessionId, String userMessage) {
        requireOwnedSession(studentId, sessionId);
        String normalizedMessage = requireMessage(userMessage);

        SseEmitter emitter = new SseEmitter(120000L);

        sseExecutor.submit(() -> {
            try {
                chatStreamProcessor.process(studentId, sessionId, normalizedMessage,
                        event -> sendSseEvent(emitter, event));
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        });

        // Setup emitter cleanup handlers
        emitter.onTimeout(emitter::complete);
        
        return emitter;
    }

    @Override
    public void streamChatOverWebSocket(
            UUID userId,
            UUID sessionId,
            String username,
            String userMessage) {
        requireOwnedSession(userId, sessionId);
        String normalizedMessage = requireMessage(userMessage);

        sseExecutor.submit(() -> chatStreamProcessor.process(
                userId,
                sessionId,
                normalizedMessage,
                event -> simpMessagingTemplate.convertAndSendToUser(
                        username,
                        "/queue/chat-sessions/" + sessionId + "/stream",
                        event)));
    }

    private void sendSseEvent(SseEmitter emitter, ChatStreamEvent event) {
        try {
            switch (event.getType()) {
                case "token" -> emitter.send(SseEmitter.event()
                        .name("message")
                        .data(event.getContent()));
                case "citations" -> emitter.send(SseEmitter.event()
                        .name("citations")
                        .data(event.getCitations()));
                case "done" -> emitter.send(SseEmitter.event()
                        .name("done")
                        .data("[DONE]"));
                case "error" -> emitter.send(SseEmitter.event()
                        .name("error")
                        .data(event.getMessage()));
                default -> throw new IllegalArgumentException("Unknown chat stream event: " + event.getType());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to send chat stream event", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getChatSessions(UUID userId) {
        Student student = requireStudent(userId);

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
        requireOwnedSession(userId, sessionId);

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
        Student student = requireStudent(userId);
        String normalizedSubject = requireSubject(subject);
        
        ChatSession session = new ChatSession();
        session.setStudent(student);
        session.setSubject(normalizedSubject);
        session.setTitle("Trò chuyện: " + normalizedSubject);
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

    @Override
    @Transactional
    public ChatSessionResponse renameChatSession(UUID userId, UUID sessionId, String title) {
        ChatSession session = requireOwnedSession(userId, sessionId);
        String normalizedTitle = requireTitle(title);
        session.setTitle(normalizedTitle);
        ChatSession saved = chatSessionRepository.save(session);
        return toSessionResponse(saved);
    }

    @Override
    @Transactional
    public void deleteChatSession(UUID userId, UUID sessionId) {
        ChatSession session = requireOwnedSession(userId, sessionId);

        // The immutable-history trigger permits this only for the current transaction.
        entityManager.createNativeQuery(
                "SELECT set_config('app.allow_history_maintenance', 'true', true)")
                .getSingleResult();

        chatMessageRepository.deleteByChatSessionId(session.getId());
        entityManager.flush();
        chatSessionRepository.delete(session);
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

    private String requireSubject(String subject) {
        String normalized = subject == null ? "" : subject.trim();
        if (normalized.isEmpty()) {
            throw new ResourceBadRequestException("Môn học không được để trống");
        }
        if (normalized.length() > 64) {
            throw new ResourceBadRequestException("Môn học không được vượt quá 64 ký tự");
        }
        return normalized;
    }

    private String requireTitle(String title) {
        String normalized = title == null ? "" : title.trim();
        if (normalized.isEmpty()) {
            throw new ResourceBadRequestException("Tên phiên chat không được để trống");
        }
        if (normalized.length() > 255) {
            throw new ResourceBadRequestException("Tên phiên chat không được vượt quá 255 ký tự");
        }
        return normalized;
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

    private ChatSessionResponse toSessionResponse(ChatSession session) {
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
