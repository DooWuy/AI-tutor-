package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.GenerateQuestionsRequest;
import com.vn.aitutor.dto.request.QuizGenerateRequest;
import com.vn.aitutor.dto.response.GenerationJobResponse;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GenerationJobService {

    private final GenerationJobStore store;
    private final GenerationWorker worker;
    private final QuestionBankService questionBankService;
    private final QuizManagementService quizManagementService;

    public GenerationJobResponse startBank(UUID lessonId, GenerateQuestionsRequest request, UserPrincipal principal) {
        QuestionType type = questionBankService.validateGenerate(lessonId, request);
        UUID userId = userId(principal);
        Optional<GenerationJobResponse> open = store.findLatestBank(userId, lessonId);
        if (open.isPresent() && blocking(open.get())) {
            return open.get();
        }
        if (open.isPresent()) {
            store.acknowledge(open.get().getId(), userId);
        }
        try {
            GenerationJobResponse created = store.insertBank(
                    userId, lessonId, request.getDifficulty(), request.getCount(), type.name());
            worker.run(created.getId());
            return created;
        } catch (DataIntegrityViolationException ex) {
            return store.findLatestBank(userId, lessonId)
                    .orElseThrow(() -> new ResourceBadRequestException("Đang có tác vụ AI cho kỹ năng này"));
        }
    }

    public GenerationJobResponse startQuiz(UUID quizId, QuizGenerateRequest request, UserPrincipal principal) {
        quizManagementService.validateGenerate(quizId, request, principal);
        UUID userId = userId(principal);
        Optional<GenerationJobResponse> open = store.findLatestQuiz(userId, quizId);
        if (open.isPresent() && "RUNNING".equals(open.get().getStatus())) {
            return open.get();
        }
        if (open.isPresent()) {
            store.acknowledge(open.get().getId(), userId);
        }
        try {
            GenerationJobResponse created = store.insertQuiz(userId, quizId, request);
            worker.run(created.getId());
            return created;
        } catch (DataIntegrityViolationException ex) {
            return store.findLatestQuiz(userId, quizId)
                    .orElseThrow(() -> new ResourceBadRequestException("Đang có tác vụ AI cho đề thi này"));
        }
    }

    public GenerationJobResponse currentBank(UUID lessonId, UserPrincipal principal) {
        return store.findLatestBank(userId(principal), lessonId).orElse(null);
    }

    public GenerationJobResponse currentQuiz(UUID quizId, UserPrincipal principal) {
        return store.findLatestQuiz(userId(principal), quizId).orElse(null);
    }

    public GenerationJobResponse get(UUID jobId, UserPrincipal principal) {
        return store.present(jobId, userId(principal));
    }

    public GenerationJobResponse acknowledge(UUID jobId, UserPrincipal principal) {
        return store.acknowledge(jobId, userId(principal));
    }

    public void acknowledgeBatch(UUID batchId) {
        store.acknowledgeBatch(batchId);
    }

    private boolean blocking(GenerationJobResponse job) {
        return "RUNNING".equals(job.getStatus()) || "DONE".equals(job.getStatus());
    }

    private UUID userId(UserPrincipal principal) {
        if (principal == null || principal.getUsers() == null || principal.getUsers().getId() == null) {
            throw new ResourceForbiddenException("Không xác định được người dùng");
        }
        return principal.getUsers().getId();
    }
}
