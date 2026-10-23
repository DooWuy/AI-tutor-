package com.vn.aitutor.service.job;

import com.vn.aitutor.service.quiz.QuestionBankService;
import com.vn.aitutor.service.quiz.QuizManagementService;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vn.aitutor.dto.request.quiz.QuizGenerateRequest;
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

    @Test void failedDonePersistenceNeverMarksSuccessfulGenerationFailed() {
        UUID jobId = UUID.randomUUID(), quizId = UUID.randomUUID(), userId = UUID.randomUUID();
        User user = new User(); user.setId(userId);
        when(store.loadWork(jobId)).thenReturn(Optional.of(new GenerationWork(jobId, GenerationJobKind.QUIZ,
                null, quizId, userId, null, 1, null, "Toán", 1, 3, 1, 0, 0, 0)));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        doThrow(new IllegalStateException("notification storage unavailable")).when(store).markDone(jobId, null, null);
        var worker = new GenerationWorker(store, questionBankService, quizManagementService, userRepository);
        assertThrows(IllegalStateException.class, () -> worker.run(jobId));
        verify(quizManagementService).generate(eq(quizId), any(), any());
        verify(store, never()).markFailed(any(), any());
    }

    @Test void generationFailureRecordsOnlyTheFinalFailure() {
        UUID jobId = UUID.randomUUID(), quizId = UUID.randomUUID(), userId = UUID.randomUUID();
        User user = new User(); user.setId(userId);
        when(store.loadWork(jobId)).thenReturn(Optional.of(new GenerationWork(jobId, GenerationJobKind.QUIZ,
                null, quizId, userId, null, 1, null, "Toán", 1, 3, 1, 0, 0, 0)));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        doThrow(new IllegalStateException("private AI error")).when(quizManagementService).generate(eq(quizId), any(), any());
        new GenerationWorker(store, questionBankService, quizManagementService, userRepository).run(jobId);
        verify(store).markFailed(jobId, "AI chưa soạn được câu hỏi. Hãy thử lại.");
        verify(store, never()).markDone(any(), any(), any());
    }

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
