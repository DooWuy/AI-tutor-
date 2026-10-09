package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.QuizGenerateRequest;
import com.vn.aitutor.dto.response.GenerationJobResponse;
import com.vn.aitutor.dto.response.QuestionResponse;
import com.vn.aitutor.entity.AiGenerationJob;
import com.vn.aitutor.entity.enums.GenerationJobKind;
import com.vn.aitutor.entity.enums.GenerationJobStatus;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.AiGenerationJobRepository;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GenerationJobStore {

    static final List<GenerationJobStatus> OPEN = List.of(
            GenerationJobStatus.RUNNING, GenerationJobStatus.DONE, GenerationJobStatus.FAILED);

    static final String INTERRUPTED = "Máy chủ khởi động lại trong lúc AI đang soạn. Hãy tạo lại.";

    private final AiGenerationJobRepository repository;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final QuestionBankService questionBankService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public GenerationJobResponse insertBank(
            UUID userId, UUID lessonId, int difficulty, int count, String questionType) {
        AiGenerationJob job = new AiGenerationJob();
        job.setKind(GenerationJobKind.BANK);
        job.setStatus(GenerationJobStatus.RUNNING);
        job.setRequestedBy(userRepository.getReferenceById(userId));
        job.setLesson(lessonRepository.getReferenceById(lessonId));
        job.setDifficulty(difficulty);
        job.setQuestionCount(count);
        job.setQuestionType(questionType);
        return toResponse(repository.saveAndFlush(job));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public GenerationJobResponse insertQuiz(UUID userId, UUID quizId, QuizGenerateRequest request) {
        AiGenerationJob job = new AiGenerationJob();
        job.setKind(GenerationJobKind.QUIZ);
        job.setStatus(GenerationJobStatus.RUNNING);
        job.setRequestedBy(userRepository.getReferenceById(userId));
        job.setQuiz(quizRepository.getReferenceById(quizId));
        job.setTopic(request.getTopic());
        job.setQuestionCount(request.getCount());
        job.setMinDifficulty(request.getMinDifficulty());
        job.setMaxDifficulty(request.getMaxDifficulty());
        job.setMultipleChoice(request.getMultipleChoice());
        job.setTrueFalse(request.getTrueFalse());
        job.setFillBlank(request.getFillBlank());
        return toResponse(repository.saveAndFlush(job));
    }

    @Transactional(readOnly = true)
    public Optional<GenerationJobResponse> findLatestBank(UUID userId, UUID lessonId) {
        return repository
                .findFirstByRequestedByIdAndLessonIdAndKindAndStatusInOrderByCreatedAtDesc(
                        userId, lessonId, GenerationJobKind.BANK, OPEN)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Optional<GenerationJobResponse> findLatestQuiz(UUID userId, UUID quizId) {
        return repository
                .findFirstByRequestedByIdAndQuizIdAndKindAndStatusInOrderByCreatedAtDesc(
                        userId, quizId, GenerationJobKind.QUIZ, OPEN)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public GenerationJobResponse present(UUID jobId, UUID userId) {
        AiGenerationJob job = require(jobId);
        assertOwner(job, userId);
        return toResponse(job);
    }

    @Transactional(readOnly = true)
    public Optional<GenerationWork> loadWork(UUID jobId) {
        return repository.findById(jobId)
                .filter(job -> job.getStatus() == GenerationJobStatus.RUNNING)
                .map(job -> new GenerationWork(
                        job.getId(),
                        job.getKind(),
                        job.getLesson() == null ? null : job.getLesson().getId(),
                        job.getQuiz() == null ? null : job.getQuiz().getId(),
                        job.getRequestedBy().getId(),
                        job.getDifficulty(),
                        job.getQuestionCount(),
                        job.getQuestionType(),
                        job.getTopic(),
                        job.getMinDifficulty(),
                        job.getMaxDifficulty(),
                        job.getMultipleChoice(),
                        job.getTrueFalse(),
                        job.getFillBlank()));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markDone(UUID jobId, UUID batchId, String message) {
        AiGenerationJob job = repository.findById(jobId).orElse(null);
        if (job == null || job.getStatus() != GenerationJobStatus.RUNNING) {
            return;
        }
        job.setStatus(GenerationJobStatus.DONE);
        job.setBatchId(batchId);
        job.setMessage(clip(message));
        job.setFinishedAt(Instant.now());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(UUID jobId, String message) {
        AiGenerationJob job = repository.findById(jobId).orElse(null);
        if (job == null || job.getStatus() != GenerationJobStatus.RUNNING) {
            return;
        }
        job.setStatus(GenerationJobStatus.FAILED);
        job.setMessage(clip(message));
        job.setFinishedAt(Instant.now());
    }

    @Transactional
    public GenerationJobResponse acknowledge(UUID jobId, UUID userId) {
        AiGenerationJob job = require(jobId);
        assertOwner(job, userId);
        if (job.getStatus() == GenerationJobStatus.RUNNING) {
            throw new ResourceBadRequestException("Tác vụ AI vẫn đang chạy");
        }
        job.setStatus(GenerationJobStatus.ACKNOWLEDGED);
        return toResponse(job);
    }

    @Transactional
    public void acknowledgeBatch(UUID batchId) {
        if (batchId == null) {
            return;
        }
        for (AiGenerationJob job : repository.findByBatchId(batchId)) {
            if (job.getStatus() != GenerationJobStatus.RUNNING) {
                job.setStatus(GenerationJobStatus.ACKNOWLEDGED);
            }
        }
    }

    @Transactional
    public int failInterrupted() {
        return repository.failRunning(INTERRUPTED, Instant.now());
    }

    private AiGenerationJob require(UUID jobId) {
        return repository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tác vụ AI"));
    }

    private void assertOwner(AiGenerationJob job, UUID userId) {
        if (job.getRequestedBy() == null || !userId.equals(job.getRequestedBy().getId())) {
            throw new ResourceForbiddenException("Bạn không xem được tác vụ AI của người khác");
        }
    }

    private GenerationJobResponse toResponse(AiGenerationJob job) {
        List<QuestionResponse> questions = null;
        if (job.getKind() == GenerationJobKind.BANK
                && job.getStatus() == GenerationJobStatus.DONE
                && job.getBatchId() != null) {
            questions = questionBankService.listPendingBatch(job.getBatchId());
        }
        return GenerationJobResponse.builder()
                .id(job.getId())
                .kind(job.getKind().name())
                .status(job.getStatus().name())
                .lessonId(job.getLesson() == null ? null : job.getLesson().getId())
                .quizId(job.getQuiz() == null ? null : job.getQuiz().getId())
                .batchId(job.getBatchId())
                .message(job.getMessage())
                .questions(questions)
                .build();
    }

    private String clip(String message) {
        if (message == null || message.isBlank()) {
            return null;
        }
        String trimmed = message.trim();
        return trimmed.length() <= 1000 ? trimmed : trimmed.substring(0, 1000);
    }
}
