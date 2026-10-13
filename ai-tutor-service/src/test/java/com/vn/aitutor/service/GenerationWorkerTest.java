package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.request.QuizGenerateRequest;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.GenerationJobKind;
import com.vn.aitutor.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GenerationWorkerTest {

    @Mock private GenerationJobStore store;
    @Mock private QuestionBankService questionBankService;
    @Mock private QuizManagementService quizManagementService;
    @Mock private UserRepository userRepository;

    @Test
    void oldQuizJobWithoutMultiSelectCountUsesZero() {
        UUID jobId = UUID.randomUUID();
        UUID quizId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        GenerationWork work = new GenerationWork(
                jobId, GenerationJobKind.QUIZ, null, quizId, userId,
                null, 5, null, "Hàm số", 2, 4, 3, 1, 1, null);
        when(store.loadWork(jobId)).thenReturn(Optional.of(work));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        GenerationWorker worker = new GenerationWorker(store, questionBankService, quizManagementService, userRepository);

        worker.run(jobId);

        ArgumentCaptor<QuizGenerateRequest> request = ArgumentCaptor.forClass(QuizGenerateRequest.class);
        verify(quizManagementService).generate(eq(quizId), request.capture(), any());
        assertEquals(0, request.getValue().getMultiSelect());
        assertEquals(3, request.getValue().getMultipleChoice());
        assertEquals(1, request.getValue().getTrueFalse());
        assertEquals(1, request.getValue().getFillBlank());
        verify(store).markDone(jobId, null, null);
    }
}
