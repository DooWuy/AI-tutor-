package com.vn.aitutor.service.job;

import com.vn.aitutor.service.quiz.QuestionBankService;
import com.vn.aitutor.service.quiz.QuizManagementService;
import com.vn.aitutor.dto.request.quiz.GenerateQuestionsRequest;
import com.vn.aitutor.dto.request.quiz.QuizGenerateRequest;
import com.vn.aitutor.dto.response.quiz.QuestionBatchResponse;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.GenerationJobKind;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.exception.ServiceUnavailableException;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationWorker {

    private final GenerationJobStore store;
    private final QuestionBankService questionBankService;
    private final QuizManagementService quizManagementService;
    private final UserRepository userRepository;

    @Async("generationExecutor")
    public void run(UUID jobId) {
        Optional<GenerationWork> loaded = store.loadWork(jobId);
        if (loaded.isEmpty()) {
            return;
        }
        GenerationWork work = loaded.get();
        UUID batchId = null;
        String warning = null;
        try {
            User user = userRepository.findById(work.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người tạo"));
            UserPrincipal principal = UserPrincipal.builder().users(user).build();
            if (work.kind() == GenerationJobKind.BANK) {
                GenerateQuestionsRequest request = new GenerateQuestionsRequest();
                request.setDifficulty(work.difficulty());
                request.setCount(work.questionCount());
                request.setQuestionType(work.questionType());
                QuestionBatchResponse batch = questionBankService.generate(work.lessonId(), request, principal);
                batchId = batch.getBatchId();
                warning = batch.getWarning();
            } else {
                QuizGenerateRequest request = new QuizGenerateRequest();
                request.setTopic(work.topic());
                request.setCount(work.questionCount());
                request.setMinDifficulty(work.minDifficulty());
                request.setMaxDifficulty(work.maxDifficulty());
                request.setMultipleChoice(work.multipleChoice());
                request.setTrueFalse(work.trueFalse());
                request.setFillBlank(work.fillBlank());
                request.setMultiSelect(work.multiSelect() == null ? 0 : work.multiSelect());
                quizManagementService.generate(work.quizId(), request, principal);
            }
        } catch (RuntimeException ex) {
            log.warn("Generation job {} failed: {}", jobId, ex.getClass().getSimpleName());
            store.markFailed(jobId, publicMessage(ex));
            return;
        }
        // Persistence/notification failure is not an AI failure. Leave the job transaction rolled back.
        store.markDone(jobId, batchId, warning);
    }

    private String publicMessage(RuntimeException ex) {
        if (ex instanceof ResourceBadRequestException
                || ex instanceof ResourceNotFoundException
                || ex instanceof ResourceForbiddenException
                || ex instanceof ServiceUnavailableException) {
            String message = ex.getMessage();
            if (message != null && !message.isBlank()) {
                return message;
            }
        }
        return "AI chưa soạn được câu hỏi. Hãy thử lại.";
    }
}
