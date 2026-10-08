package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.quiz.QuestionContentRules;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuizManagementServiceTest {

    @Mock
    private QuizRepository quizRepository;
    @Mock
    private QuizQuestionRepository quizQuestionRepository;
    @Mock
    private QuizAttemptRepository quizAttemptRepository;
    @Mock
    private QuestionBankRepository questionBankRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private QuestionBankService questionBankService;
    @Mock
    private QuestionComposer questionComposer;
    @Mock
    private QuizAccess quizAccess;
    @InjectMocks
    private QuizManagementService quizManagementService;

    @Test
    void deleteIsBlockedWhenStudentsAlreadySubmitted() {
        UUID quizId = UUID.randomUUID();
        Quiz quiz = new Quiz();
        quiz.setId(quizId);
        UserPrincipal principal = UserPrincipal.builder().build();
        when(quizAccess.require(quizId, principal)).thenReturn(quiz);
        when(quizAttemptRepository.countByQuizId(quizId)).thenReturn(3L);

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class, () -> quizManagementService.delete(quizId, principal));

        assertEquals(
                "Không thể xóa đề thi này vì đã có học sinh làm bài. Bạn chỉ có thể chuyển trạng thái đề thi sang Ngừng hoạt động (Draft/Archived).",
                error.getMessage());
        assertEquals(QuestionContentRules.DELETE_BLOCKED, error.getMessage());
        verify(quizRepository, never()).delete(quiz);
    }

    @Test
    void publishRequiresAtLeastOneQuestion() {
        UUID quizId = UUID.randomUUID();
        Quiz quiz = new Quiz();
        quiz.setId(quizId);
        UserPrincipal principal = UserPrincipal.builder().build();
        when(quizAccess.require(quizId, principal)).thenReturn(quiz);
        when(quizQuestionRepository.countByQuizId(quizId)).thenReturn(0L);

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class, () -> quizManagementService.publish(quizId, principal));

        assertEquals("Đề thi cần ít nhất một câu hỏi trước khi phát hành", error.getMessage());
        verify(quizRepository, never()).save(quiz);
    }
}
