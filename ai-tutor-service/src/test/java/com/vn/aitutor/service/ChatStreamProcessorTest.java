package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.agent.AiTutorChatAgent;
import com.vn.aitutor.entity.ChatSession;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.dto.response.ChatStreamEvent;
import com.vn.aitutor.repository.AuditLogRepository;
import com.vn.aitutor.repository.ChatMessageRepository;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.StudentRepository;
import dev.langchain4j.service.Result;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChatStreamProcessorTest {

    @Mock private ChatSessionRepository chatSessionRepository;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private AiTutorChatAgent aiTutorChatAgent;
    @Mock private ContentSafetyService contentSafetyService;
    @Mock private AuditLogRepository auditLogRepository;

    private ChatStreamProcessor processor;
    private UUID userId;
    private UUID sessionId;
    private ChatSession session;

    @BeforeEach
    void setUp() {
        processor = new ChatStreamProcessor(
                chatSessionRepository,
                chatMessageRepository,
                studentRepository,
                aiTutorChatAgent,
                contentSafetyService,
                auditLogRepository);
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        Student student = new Student();
        student.setId(UUID.randomUUID());
        session = new ChatSession();
        session.setId(sessionId);
        session.setStudent(student);
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
    }

    @Test
    void unsafeMessageIsRejectedWithoutCallingAgent() {
        when(contentSafetyService.isSafe("tin nhắn bị chặn")).thenReturn(false);
        when(contentSafetyService.getRejectionMessage()).thenReturn("Không phù hợp");
        List<ChatStreamEvent> events = new ArrayList<>();

        processor.process(userId, sessionId, "  tin nhắn bị chặn  ", events::add);

        assertEquals("token", events.get(0).getType());
        assertEquals("done", events.get(events.size() - 1).getType());
        verify(auditLogRepository).save(org.mockito.ArgumentMatchers.any());
        verify(aiTutorChatAgent, never()).chat(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        verify(chatMessageRepository, org.mockito.Mockito.times(2)).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void safeMessageEmitsTokensAndDone() {
        when(contentSafetyService.isSafe("câu hỏi")).thenReturn(true);
        when(aiTutorChatAgent.chat(sessionId.toString(), "câu hỏi"))
                .thenReturn(Result.<String>builder().content("A B").build());
        List<ChatStreamEvent> events = new ArrayList<>();

        processor.process(userId, sessionId, "câu hỏi", events::add);

        assertTrue(events.stream().anyMatch(event -> "token".equals(event.getType())));
        assertEquals("done", events.get(events.size() - 1).getType());
        verify(chatMessageRepository, org.mockito.Mockito.times(2)).save(org.mockito.ArgumentMatchers.any());
    }
}
