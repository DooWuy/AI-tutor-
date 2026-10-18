package com.vn.aitutor.service.quiz;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.response.quiz.QuizAttemptDetailResponse;
import com.vn.aitutor.dto.response.quiz.QuizAttemptHistoryResponse;
import com.vn.aitutor.entity.*;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.service.quiz.StudentQuizAttemptServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class StudentQuizAttemptServiceImplTest {

    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private QuizAttemptAnswerRepository quizAttemptAnswerRepository;
    @Mock private QuizAccessService access;

    private StudentQuizAttemptServiceImpl service;
    private Student currentStudent;
    private UUID studentId;

    @BeforeEach
    void setUp() {
        service = new StudentQuizAttemptServiceImpl(
                quizAttemptRepository,
                quizAttemptAnswerRepository,
                access
        );

        studentId = UUID.randomUUID();
        currentStudent = new Student();
        currentStudent.setId(studentId);
    }

    @Test
    void getMyHistory_returnsHistoryList() {
        when(access.currentStudent()).thenReturn(currentStudent);

        Quiz quiz = new Quiz();
        quiz.setId(UUID.randomUUID());
        quiz.setTitle("Đề luyện tập Toán");
        quiz.setAiGenerated(true);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(UUID.randomUUID());
        attempt.setQuiz(quiz);
        attempt.setStudent(currentStudent);
        attempt.setScore(9.0);
        attempt.setXpEarned(50);
        attempt.setDurationSeconds(1200);
        attempt.setSubmittedAt(Instant.now());

        when(quizAttemptRepository.findVisibleHistoryByStudentId(studentId))
                .thenReturn(List.of(attempt));

        List<QuizAttemptHistoryResponse> history = service.getMyHistory();

        assertEquals(1, history.size());
        assertEquals("Đề luyện tập Toán", history.get(0).getQuizTitle());
        assertEquals(9.0, history.get(0).getScore());
        assertEquals(50, history.get(0).getXpEarned());
    }

    @Test
    void hideAttempt_attemptNotFound_throwsNotFound() {
        UUID attemptId = UUID.randomUUID();
        when(access.currentStudent()).thenReturn(currentStudent);
        when(quizAttemptRepository.findById(attemptId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.hideAttempt(attemptId));
    }

    @Test
    void hideAttempt_notOwner_throwsForbidden() {
        UUID attemptId = UUID.randomUUID();
        when(access.currentStudent()).thenReturn(currentStudent);

        Student otherStudent = new Student();
        otherStudent.setId(UUID.randomUUID());

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(attemptId);
        attempt.setStudent(otherStudent);

        when(quizAttemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));

        assertThrows(ResourceForbiddenException.class, () -> service.hideAttempt(attemptId));
    }

    @Test
    void hideAttempt_assignedQuiz_throwsForbidden() {
        UUID attemptId = UUID.randomUUID();
        when(access.currentStudent()).thenReturn(currentStudent);

        Quiz quiz = new Quiz();
        quiz.setAiGenerated(false); // Đề do giáo viên giao

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(attemptId);
        attempt.setStudent(currentStudent);
        attempt.setQuiz(quiz);

        when(quizAttemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));

        ResourceForbiddenException ex = assertThrows(ResourceForbiddenException.class, () -> service.hideAttempt(attemptId));
        assertEquals("Cannot hide assigned quizzes", ex.getMessage());
    }

    @Test
    void hideAttempt_aiGenerated_success() {
        UUID attemptId = UUID.randomUUID();
        when(access.currentStudent()).thenReturn(currentStudent);

        Quiz quiz = new Quiz();
        quiz.setAiGenerated(true);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(attemptId);
        attempt.setStudent(currentStudent);
        attempt.setQuiz(quiz);
        attempt.setIsVisible(true);

        when(quizAttemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));

        service.hideAttempt(attemptId);

        assertFalse(attempt.getIsVisible());
        verify(quizAttemptRepository).save(attempt);
    }

    @Test
    void getAttemptDetail_success() {
        UUID attemptId = UUID.randomUUID();
        when(access.currentStudent()).thenReturn(currentStudent);

        Quiz quiz = new Quiz();
        quiz.setId(UUID.randomUUID());
        quiz.setTitle("Đề kiểm tra 15 phút");
        quiz.setAiGenerated(true);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(attemptId);
        attempt.setStudent(currentStudent);
        attempt.setQuiz(quiz);
        attempt.setScore(10.0);
        attempt.setXpEarned(100);

        QuizQuestion question = new QuizQuestion();
        question.setId(UUID.randomUUID());
        question.setQuestionText("1 + 1 = ?");
        question.setOrderIndex(1);
        question.setCorrectOptionKey("B");
        question.setExplanation("1 cộng 1 bằng 2");

        QuizAttemptAnswer answer = new QuizAttemptAnswer();
        answer.setId(UUID.randomUUID());
        answer.setQuestion(question);
        answer.setSelectedOptionKey("B");
        answer.setCorrect(true);

        when(quizAttemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));
        when(quizAttemptAnswerRepository.findByAttemptId(attemptId)).thenReturn(List.of(answer));

        QuizAttemptDetailResponse detail = service.getAttemptDetail(attemptId);

        assertNotNull(detail);
        assertEquals(attemptId, detail.getId());
        assertEquals("Đề kiểm tra 15 phút", detail.getQuizTitle());
        assertEquals(1, detail.getAnswers().size());
        assertTrue(detail.getAnswers().get(0).isCorrect());
        assertEquals("B", detail.getAnswers().get(0).getSelectedOptionKey());
    }
}
