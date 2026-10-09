package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.response.QuizStatisticsResponse;
import com.vn.aitutor.dto.response.StudentQuizResultResponse;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizAttempt;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuizStatisticsServiceTest {

    @Mock
    private QuizAccess quizAccess;
    @Mock
    private QuizAttemptRepository quizAttemptRepository;
    @Mock
    private QuizAttemptAnswerRepository quizAttemptAnswerRepository;
    @InjectMocks
    private QuizStatisticsService quizStatisticsService;

    @Test
    void passingUsesTheBestScoreWhenAStudentHasSeveralAttempts() {
        UUID quizId = UUID.randomUUID();
        Quiz quiz = new Quiz();
        quiz.setId(quizId);
        quiz.setTitle("Kiểm tra Đại số 15 phút");
        quiz.setSubject("TOAN");
        quiz.setPassingScore(new BigDecimal("70.0"));
        UserPrincipal principal = UserPrincipal.builder().build();
        Student passed = student("HS01", "Học sinh đạt");
        Student failed = student("HS02", "Học sinh chưa đạt");
        when(quizAccess.require(quizId, principal)).thenReturn(quiz);
        when(quizAttemptRepository.findSubmittedWithScore(quizId)).thenReturn(List.of(
                attempt(passed, 6.0, Instant.parse("2026-10-08T01:00:00Z")),
                attempt(passed, 8.0, Instant.parse("2026-10-08T02:00:00Z")),
                attempt(failed, 6.5, Instant.parse("2026-10-08T03:00:00Z"))));
        when(quizAttemptAnswerRepository.aggregateWrongRates(quizId)).thenReturn(List.of());

        QuizStatisticsResponse stats = quizStatisticsService.statistics(quizId, principal);

        assertEquals(3L, stats.getAttemptCount());
        assertEquals(new BigDecimal("6.8333"), stats.getAverageScore());
        assertEquals(new BigDecimal("50.0"), stats.getPassingRate());
        StudentQuizResultResponse first = stats.getStudents().get(0);
        StudentQuizResultResponse second = stats.getStudents().get(1);
        assertEquals(8.0, first.getBestScore());
        assertTrue(first.isPassed());
        assertEquals(2, first.getAttemptCount());
        assertEquals(6.5, second.getBestScore());
        assertFalse(second.isPassed());
    }

    private static Student student(String code, String name) {
        User user = new User();
        user.setFullName(name);
        Student student = new Student();
        student.setId(UUID.randomUUID());
        student.setStudentCode(code);
        student.setUser(user);
        student.setClassName("12A1");
        return student;
    }

    private static QuizAttempt attempt(Student student, double score, Instant submittedAt) {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setStudent(student);
        attempt.setScore(score);
        attempt.setSubmittedAt(submittedAt);
        return attempt;
    }
}
