package com.vn.aitutor.service.quiz;

import com.vn.aitutor.dto.request.quiz.*;
import com.vn.aitutor.dto.response.*;
import com.vn.aitutor.dto.response.quiz.*;
import com.vn.aitutor.service.gamification.StreakService;
import com.vn.aitutor.service.gamification.XpAwardResult;
import com.vn.aitutor.service.gamification.XpAwardService;
import com.vn.aitutor.entity.*;
import com.vn.aitutor.exception.*;
import com.vn.aitutor.repository.*;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizSubmissionService {
    private final QuizAccessService access;
    private final StudentRepository students;
    private final QuizAttemptDraftRepository drafts;
    private final QuizAttemptDraftAnswerRepository draftAnswers;
    private final QuizAttemptRepository attempts;
    private final QuizAttemptAnswerRepository answers;
    private final QuizQuestionRepository questions;
    private final QuizGradingService grading;
    private final XpAwardService xpAwards;
    private final StreakService streaks;
    private final Clock learningClock;
    private final IStudentQuizAttemptService results;
    private final jakarta.persistence.EntityManager entityManager;

    @Transactional(readOnly = true)
    public QuizContentResponse content(UUID quizId) {
        Quiz quiz = access.requireQuiz(quizId, access.currentStudent());
        return new QuizContentResponse(quiz.getId(), quiz.getTitle(), quiz.getSubject(), quiz.getTimeLimit() == null ? 0 : quiz.getTimeLimit(),
                access.readyQuestions(quizId).stream().map(q -> new QuizContentResponse.Question(q.getId(), q.getQuestionText(),
                        q.getType() == null ? com.vn.aitutor.entity.enums.QuestionType.MULTIPLE_CHOICE : q.getType(),
                        q.getOptions().stream().map(o -> {
                            Object body = o.get("content") != null ? o.get("content") : o.get("text");
                            return Map.<String,Object>of("key", o.get("key"), "content", body == null ? "" : body);
                        }).toList(), q.getOrderIndex())).toList());
    }

    @Transactional
    public QuizDraftResponse saveDraft(QuizDraftRequest request) {
        Student student = lockStudent(access.currentStudent().getId());
        Quiz quiz = access.requireQuiz(request.quizId(), student);
        List<QuizQuestion> quizQuestions = access.readyQuestions(quiz.getId());
        QuizAttemptDraft draft;
        if (request.draftId() != null) {
            draft = ownedDraft(request.draftId(), student);
            if (!draft.getQuiz().getId().equals(quiz.getId())) throw new ResourceBadRequestException("Draft does not belong to quiz");
        } else {
            draft = drafts.findByStudentIdAndQuizIdAndCompletedAtIsNull(student.getId(), quiz.getId()).orElse(null);
            if (draft == null) {
                if (quiz.getTimeLimit() == null || quiz.getTimeLimit() <= 0)
                    throw new ResourceConflictException("Quiz must have a positive time limit");
                draft = new QuizAttemptDraft();
                draft.setQuiz(quiz); draft.setStudent(student);
                draft.setStartedAt(learningClock.instant());
                draft.setExpiresAt(draft.getStartedAt().plusSeconds(quiz.getTimeLimit() * 60L));
                draft.setUpdatedAt(draft.getStartedAt());
                drafts.saveAndFlush(draft);
            } else draft = ownedDraft(draft.getId(), student);
        }
        if (draft.getCompletedAt() != null) throw new ResourceConflictException("Draft has been submitted");
        if (!learningClock.instant().isBefore(draft.getExpiresAt())) {
            if (!request.answers().isEmpty()) throw new ResourceConflictException("Quiz time has expired");
            // Starting/resuming an expired draft resolves it instead of resetting its timer.
            finish(draft, student);
            return response(draft);
        }
        upsert(draft, request.answers(), quizQuestions);
        return response(draft);
    }

    @Transactional(readOnly = true)
    public QuizDraftResponse getDraft(UUID id) {
        QuizAttemptDraft draft = drafts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Draft not found"));
        requireOwner(draft, access.currentStudent());
        return response(draft);
    }

    @Transactional
    public QuizAttemptDetailResponse submit(QuizSubmitRequest request) {
        Student student = lockStudent(access.currentStudent().getId());
        QuizAttemptDraft draft = ownedDraft(request.draftId(), student);
        Optional<QuizAttempt> existing = attempts.findBySourceDraftId(draft.getId());
        if (existing.isPresent()) return results.getAttemptDetail(existing.get().getId());
        // Expired requests cannot introduce answers after the server deadline.
        if (learningClock.instant().isBefore(draft.getExpiresAt()))
            upsert(draft, request.answers(), questions.findByQuizIdOrderByOrderIndexAsc(draft.getQuiz().getId()));
        QuizAttempt attempt = finish(draft, student);
        return results.getAttemptDetail(attempt.getId());
    }

    @Transactional
    public void expire(UUID id) {
        UUID studentId = drafts.findStudentId(id).orElse(null);
        if (studentId == null) return;
        Student student = lockStudent(studentId);
        QuizAttemptDraft draft = drafts.lockById(id).orElseThrow();
        if (draft.getCompletedAt() == null && !learningClock.instant().isBefore(draft.getExpiresAt())) finish(draft, student);
    }

    private Student lockStudent(UUID id) {
        Student student = students.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        // A currentStudent lookup may have loaded this entity before another submission committed.
        // Refresh under the lock so simultaneous completions cannot overwrite newly earned XP.
        entityManager.refresh(student, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return student;
    }
    private QuizAttemptDraft ownedDraft(UUID id, Student student) {
        QuizAttemptDraft draft = drafts.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Draft not found"));
        requireOwner(draft, student);
        return draft;
    }
    private void requireOwner(QuizAttemptDraft draft, Student student) {
        if (!draft.getStudent().getId().equals(student.getId())) throw new ResourceForbiddenException("Draft belongs to another student");
    }
    private void upsert(QuizAttemptDraft draft, List<QuizAnswerRequest> input, List<QuizQuestion> quizQuestions) {
        Map<UUID, QuizQuestion> questionMap = quizQuestions.stream().collect(Collectors.toMap(QuizQuestion::getId, q -> q));
        Map<UUID, QuizAttemptDraftAnswer> stored = draftAnswers.findByDraftId(draft.getId()).stream()
                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a));
        Set<UUID> seen = new HashSet<>();
        for (QuizAnswerRequest value : input) {
            QuizQuestion question = questionMap.get(value.questionId());
            if (question == null || !seen.add(value.questionId()) || (value.value() != null && value.value().length() > 200))
                throw new ResourceBadRequestException("Invalid or duplicate quiz answer");
            String text = value.value();
            com.vn.aitutor.entity.enums.QuestionType type = question.getType();
            if (text != null && !text.isBlank() && type != com.vn.aitutor.entity.enums.QuestionType.FILL_BLANK) {
                if (type == com.vn.aitutor.entity.enums.QuestionType.MULTI_SELECT) {
                    Set<String> selected = QuizGradingService.choiceKeys(text);
                    Set<String> optionKeys = question.getOptions().stream()
                            .map(option -> option.get("key"))
                            .filter(String.class::isInstance)
                            .map(key -> ((String) key).toUpperCase(Locale.ROOT))
                            .collect(Collectors.toSet());
                    if (selected.isEmpty() || !optionKeys.containsAll(selected))
                        throw new ResourceBadRequestException("Unknown option key");
                } else if (question.getOptions().stream().noneMatch(option -> text.equals(option.get("key")))) {
                    throw new ResourceBadRequestException("Unknown option key");
                }
            }
            QuizAttemptDraftAnswer answer = stored.getOrDefault(value.questionId(), new QuizAttemptDraftAnswer());
            answer.setDraft(draft); answer.setQuestion(question); answer.setAnswerValue(text); answer.setUpdatedAt(learningClock.instant());
            draftAnswers.save(answer);
        }
        draft.setUpdatedAt(learningClock.instant());
    }
    private QuizAttempt finish(QuizAttemptDraft draft, Student student) {
        List<QuizQuestion> quizQuestions = questions.findByQuizIdOrderByOrderIndexAsc(draft.getQuiz().getId());
        if (quizQuestions.isEmpty()) throw new ResourceConflictException("Quiz has no questions");
        Map<UUID, String> saved = new HashMap<>();
        draftAnswers.findByDraftId(draft.getId()).forEach(a -> saved.put(a.getQuestion().getId(), a.getAnswerValue()));
        int correct = (int) quizQuestions.stream().filter(q -> grading.correct(q, saved.get(q.getId()))).count();
        int rawXp = Math.multiplyExact(correct, 10);
        boolean previouslyCompleted = attempts.existsByStudentIdAndQuizId(student.getId(), draft.getQuiz().getId());
        Instant now = learningClock.instant();
        Instant submitted = now.isBefore(draft.getExpiresAt()) ? now : draft.getExpiresAt();
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(draft.getQuiz()); attempt.setStudent(student); attempt.setSourceDraftId(draft.getId());
        attempt.setScore(grading.score(correct, quizQuestions.size())); attempt.setCorrectCount(correct);
        attempt.setXpEarned(0); attempt.setSubmittedAt(submitted);
        attempt.setDurationSeconds(Math.toIntExact(Duration.between(draft.getStartedAt(), submitted).getSeconds()));
        xpAwards.awardQuizCompletion(
                student,
                draft.getQuiz().getId(),
                attempt,
                rawXp,
                previouslyCompleted,
                submitted);
        streaks.recordCompletion(student, submitted);
        for (QuizQuestion question : quizQuestions) {
            QuizAttemptAnswer answer = new QuizAttemptAnswer();
            answer.setAttempt(attempt); answer.setQuestion(question); answer.setSelectedOptionKey(saved.get(question.getId()));
            answer.setCorrect(grading.correct(question, saved.get(question.getId()))); answers.save(answer);
        }
        draft.setCompletedAt(submitted); draft.setUpdatedAt(now);
        return attempt;
    }
    private QuizDraftResponse response(QuizAttemptDraft draft) {
        List<QuizAnswerRequest> values = draftAnswers.findByDraftId(draft.getId()).stream()
                .map(a -> new QuizAnswerRequest(a.getQuestion().getId(), a.getAnswerValue())).toList();
        return new QuizDraftResponse(draft.getId(), draft.getQuiz().getId(), draft.getStartedAt(), draft.getExpiresAt(), learningClock.instant(),
                values.stream().filter(a -> a.value() != null && !a.value().isBlank()).count(), values,
                attempts.findBySourceDraftId(draft.getId()).map(QuizAttempt::getId).orElse(null));
    }
}
