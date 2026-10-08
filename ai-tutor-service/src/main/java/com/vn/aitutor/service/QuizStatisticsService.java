package com.vn.aitutor.service;

import com.vn.aitutor.analytics.KpiCalculator;
import com.vn.aitutor.dto.response.HardQuestionResponse;
import com.vn.aitutor.dto.response.QuizStatisticsResponse;
import com.vn.aitutor.dto.response.StudentQuizResultResponse;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizAttempt;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.quiz.QuizResultWorkbook;
import com.vn.aitutor.quiz.QuizResultWorkbook.RowData;
import com.vn.aitutor.quiz.QuizStatisticsCalculator;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.projection.QuestionWrongRateRow;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizStatisticsService {

    private final QuizAccess quizAccess;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptAnswerRepository quizAttemptAnswerRepository;

    @Transactional(readOnly = true)
    public QuizStatisticsResponse statistics(UUID quizId, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        List<QuizAttempt> attempts = quizAttemptRepository.findSubmittedWithScore(quizId);
        Map<UUID, StudentAggregate> students = aggregate(attempts);
        List<Double> bestScores = students.values().stream().map(StudentAggregate::bestScore).toList();
        double scoreSum = attempts.stream().mapToDouble(QuizAttempt::getScore).sum();
        return QuizStatisticsResponse.builder()
                .quizId(quiz.getId())
                .title(quiz.getTitle())
                .passingScore(quiz.getPassingScore())
                .attemptCount(attempts.size())
                .averageScore(KpiCalculator.averageScore(scoreSum, attempts.size()))
                .passingRate(QuizStatisticsCalculator.passingRate(bestScores, quiz.getPassingScore()))
                .hardestQuestions(hardest(quizId))
                .students(students.values().stream().map(row -> row.toResponse(quiz.getPassingScore())).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] export(UUID quizId, UserPrincipal principal) {
        Quiz quiz = quizAccess.require(quizId, principal);
        List<QuizAttempt> attempts = quizAttemptRepository.findSubmittedWithScore(quizId);
        String subject = subjectLabel(quiz.getSubject());
        List<RowData> rows = new ArrayList<>();
        for (QuizAttempt attempt : attempts) {
            Student student = attempt.getStudent();
            rows.add(new RowData(
                    student.getStudentCode(),
                    student.getUser().getFullName(),
                    className(student),
                    subject,
                    quiz.getTitle(),
                    attempt.getScore(),
                    QuizStatisticsCalculator.passes(attempt.getScore(), quiz.getPassingScore()),
                    attempt.getDurationSeconds(),
                    attempt.getSubmittedAt()));
        }
        return QuizResultWorkbook.write(rows);
    }

    private List<HardQuestionResponse> hardest(UUID quizId) {
        List<QuestionWrongRateRow> rows = quizAttemptAnswerRepository.aggregateWrongRates(quizId);
        List<HardQuestionResponse> result = new ArrayList<>();
        for (QuestionWrongRateRow row : rows) {
            long answers = row.getAnswerCount() == null ? 0 : row.getAnswerCount();
            long wrong = row.getWrongCount() == null ? 0 : row.getWrongCount();
            BigDecimal rate = answers == 0
                    ? new BigDecimal("0.0")
                    : BigDecimal.valueOf(wrong)
                            .multiply(BigDecimal.valueOf(100))
                            .divide(BigDecimal.valueOf(answers), 1, RoundingMode.HALF_UP);
            result.add(HardQuestionResponse.builder()
                    .questionId(row.getQuestionId())
                    .stem(row.getStem())
                    .wrongCount(wrong)
                    .answerCount(answers)
                    .wrongRate(rate)
                    .build());
        }
        return result;
    }

    private Map<UUID, StudentAggregate> aggregate(List<QuizAttempt> attempts) {
        Map<UUID, StudentAggregate> students = new LinkedHashMap<>();
        for (QuizAttempt attempt : attempts) {
            Student student = attempt.getStudent();
            StudentAggregate aggregate = students.computeIfAbsent(student.getId(), id -> new StudentAggregate(student));
            aggregate.add(attempt);
        }
        return students;
    }

    private String className(Student student) {
        if (student.getClassEntity() != null && student.getClassEntity().getName() != null) {
            return student.getClassEntity().getName();
        }
        return student.getClassName();
    }

    private String subjectLabel(String subject) {
        try {
            return SubjectCode.parseRequired(subject).getDisplayName();
        } catch (RuntimeException ex) {
            return subject;
        }
    }

    private final class StudentAggregate {
        private final Student student;
        private double bestScore = Double.NEGATIVE_INFINITY;
        private int attemptCount;
        private java.time.Instant lastSubmittedAt;

        private StudentAggregate(Student student) {
            this.student = student;
        }

        private void add(QuizAttempt attempt) {
            attemptCount++;
            if (attempt.getScore() > bestScore) {
                bestScore = attempt.getScore();
            }
            if (lastSubmittedAt == null || attempt.getSubmittedAt().isAfter(lastSubmittedAt)) {
                lastSubmittedAt = attempt.getSubmittedAt();
            }
        }

        private double bestScore() {
            return bestScore;
        }

        private StudentQuizResultResponse toResponse(BigDecimal passingScore) {
            return StudentQuizResultResponse.builder()
                    .studentId(student.getId())
                    .studentCode(student.getStudentCode())
                    .fullName(student.getUser().getFullName())
                    .className(className(student))
                    .bestScore(bestScore)
                    .attemptCount(attemptCount)
                    .passed(QuizStatisticsCalculator.passes(bestScore, passingScore))
                    .lastSubmittedAt(lastSubmittedAt)
                    .build();
        }
    }
}
