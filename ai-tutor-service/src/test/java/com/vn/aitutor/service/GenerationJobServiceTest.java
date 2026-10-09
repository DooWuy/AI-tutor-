package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.request.GenerateQuestionsRequest;
import com.vn.aitutor.dto.response.GenerationJobResponse;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GenerationJobServiceTest {

    @Mock
    private GenerationJobStore store;
    @Mock
    private GenerationWorker worker;
    @Mock
    private QuestionBankService questionBankService;
    @Mock
    private QuizManagementService quizManagementService;

    private GenerationJobService service;
    private UUID userId;
    private UUID lessonId;
    private UserPrincipal principal;
    private GenerateQuestionsRequest request;

    @BeforeEach
    void setUp() {
        service = new GenerationJobService(store, worker, questionBankService, quizManagementService);
        userId = UUID.randomUUID();
        lessonId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        principal = UserPrincipal.builder().users(user).build();
        request = new GenerateQuestionsRequest();
        request.setDifficulty(3);
        request.setCount(2);
        request.setQuestionType("MULTIPLE_CHOICE");
    }

    @Test
    void runningBankJobIsReused() {
        GenerationJobResponse existing = GenerationJobResponse.builder()
                .id(UUID.randomUUID())
                .kind("BANK")
                .status("RUNNING")
                .lessonId(lessonId)
                .build();
        when(questionBankService.validateGenerate(lessonId, request)).thenReturn(QuestionType.MULTIPLE_CHOICE);
        when(store.findLatestBank(userId, lessonId)).thenReturn(Optional.of(existing));

        GenerationJobResponse actual = service.startBank(lessonId, request, principal);

        assertEquals(existing.getId(), actual.getId());
        verify(worker, never()).run(any());
        verify(store, never()).insertBank(any(), any(), eq(3), eq(2), any());
    }

    @Test
    void doneBankDraftBlocksASecondJob() {
        GenerationJobResponse existing = GenerationJobResponse.builder()
                .id(UUID.randomUUID())
                .kind("BANK")
                .status("DONE")
                .lessonId(lessonId)
                .build();
        when(questionBankService.validateGenerate(lessonId, request)).thenReturn(QuestionType.MULTIPLE_CHOICE);
        when(store.findLatestBank(userId, lessonId)).thenReturn(Optional.of(existing));

        GenerationJobResponse actual = service.startBank(lessonId, request, principal);

        assertEquals("DONE", actual.getStatus());
        verify(worker, never()).run(any());
    }

    @Test
    void failedBankJobStartsAFreshOne() {
        UUID failedId = UUID.randomUUID();
        UUID createdId = UUID.randomUUID();
        GenerationJobResponse failed = GenerationJobResponse.builder()
                .id(failedId)
                .kind("BANK")
                .status("FAILED")
                .lessonId(lessonId)
                .build();
        GenerationJobResponse created = GenerationJobResponse.builder()
                .id(createdId)
                .kind("BANK")
                .status("RUNNING")
                .lessonId(lessonId)
                .build();
        when(questionBankService.validateGenerate(lessonId, request)).thenReturn(QuestionType.MULTIPLE_CHOICE);
        when(store.findLatestBank(userId, lessonId)).thenReturn(Optional.of(failed));
        when(store.insertBank(userId, lessonId, 3, 2, "MULTIPLE_CHOICE")).thenReturn(created);

        GenerationJobResponse actual = service.startBank(lessonId, request, principal);

        assertEquals(createdId, actual.getId());
        verify(store).acknowledge(failedId, userId);
        verify(worker).run(createdId);
    }
}
