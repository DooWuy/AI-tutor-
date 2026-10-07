package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.timeout;

import com.vn.aitutor.agent.AiTutorChatAgent;
import com.vn.aitutor.entity.ChatSession;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.AuditLogRepository;
import com.vn.aitutor.repository.ChatMessageRepository;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.service.impl.ChatServiceImpl;
import com.vn.aitutor.service.ChatStreamProcessor;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import com.vn.aitutor.dto.response.ChatStreamEvent;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    @Mock private ChatSessionRepository chatSessionRepository;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private AiTutorChatAgent aiTutorChatAgent;
    @Mock private StudentRepository studentRepository;
    @Mock private ContentSafetyService contentSafetyService;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private EntityManager entityManager;
    @Mock private Query maintenanceQuery;
    @Mock private ChatStreamProcessor chatStreamProcessor;
    @Mock private org.springframework.messaging.simp.SimpMessagingTemplate simpMessagingTemplate;

    private ChatServiceImpl service;
    private UUID userId;
    private UUID studentId;
    private UUID sessionId;
    private Student student;
    private ChatSession session;

    @BeforeEach
    void setUp() {
        service = new ChatServiceImpl(
                chatSessionRepository,
                chatMessageRepository,
                studentRepository,
                entityManager,
                chatStreamProcessor,
                simpMessagingTemplate);

        userId = UUID.randomUUID();
        studentId = UUID.randomUUID();
        sessionId = UUID.randomUUID();

        student = new Student();
        student.setId(studentId);
        session = new ChatSession();
        session.setId(sessionId);
        session.setStudent(student);
        session.setTitle("Trò chuyện: Toán học");
    }

    @Test
    void renameRequiresSessionOwnership() {
        Student otherStudent = new Student();
        otherStudent.setId(UUID.randomUUID());
        session.setStudent(otherStudent);
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(ResourceForbiddenException.class,
                () -> service.renameChatSession(userId, sessionId, "Ôn đạo hàm"));
    }

    @Test
    void renameTrimsAndPersistsTitle() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(chatSessionRepository.save(session)).thenReturn(session);

        service.renameChatSession(userId, sessionId, "  Ôn đạo hàm  ");

        assertEquals("Ôn đạo hàm", session.getTitle());
        verify(chatSessionRepository).save(session);
    }

    @Test
    void renameRejectsBlankTitle() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(ResourceBadRequestException.class,
                () -> service.renameChatSession(userId, sessionId, "   "));
    }

    @Test
    void deleteUsesMaintenanceFlagAndDeletesMessagesBeforeSession() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(entityManager.createNativeQuery("SELECT set_config('app.allow_history_maintenance', 'true', true)"))
                .thenReturn(maintenanceQuery);

        service.deleteChatSession(userId, sessionId);

        verify(maintenanceQuery).getSingleResult();
        verify(chatMessageRepository).deleteByChatSessionId(sessionId);
        verify(chatSessionRepository).delete(session);
    }

    @Test
    void websocketUsesUserQueueDestination() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        ArgumentCaptor<Consumer<ChatStreamEvent>> sinkCaptor = ArgumentCaptor.forClass(Consumer.class);

        service.streamChatOverWebSocket(userId, sessionId, "student-one", "Câu hỏi");

        verify(chatStreamProcessor, timeout(1000)).process(
                org.mockito.ArgumentMatchers.eq(userId),
                org.mockito.ArgumentMatchers.eq(sessionId),
                org.mockito.ArgumentMatchers.eq("Câu hỏi"),
                sinkCaptor.capture());

        sinkCaptor.getValue().accept(ChatStreamEvent.done());

        verify(simpMessagingTemplate).convertAndSendToUser(
                "student-one",
                "/queue/chat-sessions/" + sessionId + "/stream",
                ChatStreamEvent.done());
    }
}
