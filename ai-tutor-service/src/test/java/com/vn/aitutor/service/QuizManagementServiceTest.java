package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.request.QuizGenerateRequest;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.quiz.ChoiceInput;
import com.vn.aitutor.quiz.NormalizedQuestion;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.QuestionComposer.ComposeRequest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuizManagementServiceTest {

    @Mock private QuizRepository quizRepository;
    @Mock private QuizQuestionRepository quizQuestionRepository;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private LessonRepository lessonRepository;
    @Mock private UserRepository userRepository;
    @Mock private QuestionBankService questionBankService;
    @Mock private QuestionComposer questionComposer;
    @Mock private QuizAccess quizAccess;

    private QuizManagementService service;
    private Quiz quiz;

    @BeforeEach
    void setUp() {
        service = new QuizManagementService(
                quizRepository,
                quizQuestionRepository,
                quizAttemptRepository,
                questionBankRepository,
                lessonRepository,
                userRepository,
                questionBankService,
                questionComposer,
                quizAccess);
        quiz = new Quiz();
        quiz.setId(UUID.randomUUID());
        quiz.setTitle("Đề kiểm tra");
        quiz.setSubject("TOAN");
        quiz.setGradeLevel("12");
    }

    @Test
    void multiSelectCountIsPartOfTheRatio() {
        when(quizAccess.require(quiz.getId(), null)).thenReturn(quiz);
        QuizGenerateRequest request = request(5, 3, 1, 1, 0);

        service.validateGenerate(quiz.getId(), request, null);

        QuizGenerateRequest over = request(5, 3, 1, 1, 1);
        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class,
                () -> service.validateGenerate(quiz.getId(), over, null));
        assertEquals("Tổng tỷ lệ loại câu phải bằng số lượng câu hỏi", error.getMessage());
    }

    @Test
    void missingMultiSelectCountCountsAsZero() {
        when(quizAccess.require(quiz.getId(), null)).thenReturn(quiz);
        QuizGenerateRequest request = request(5, 3, null, 1, 1);

        service.validateGenerate(quiz.getId(), request, null);
    }

    @Test
    void generateAsksForFourChoicesWhenTheRatioIncludesMultiSelect() {
        when(quizAccess.require(quiz.getId(), null)).thenReturn(quiz);
        when(quizQuestionRepository.maxOrderIndex(quiz.getId())).thenReturn(0);
        when(quizQuestionRepository.findSourceIds(quiz.getId())).thenReturn(List.of());
        when(questionBankRepository.findActiveForQuiz(any(), anyInt(), anyInt(), any(), any(), anyBoolean(), any()))
                .thenReturn(List.of());
        when(questionComposer.compose(any())).thenReturn(List.of(draft()));
        when(quizRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId())).thenReturn(List.of());

        service.generate(quiz.getId(), request(1, 0, 1, 0, 0), null);

        ArgumentCaptor<ComposeRequest> compose = ArgumentCaptor.forClass(ComposeRequest.class);
        verify(questionComposer).compose(compose.capture());
        assertEquals(QuestionType.MULTI_SELECT, compose.getValue().type());
        assertEquals(4, compose.getValue().exactChoiceCount());
        assertEquals(1, compose.getValue().count());

        ArgumentCaptor<QuizQuestion> saved = ArgumentCaptor.forClass(QuizQuestion.class);
        verify(quizQuestionRepository).save(saved.capture());
        assertEquals(QuestionType.MULTI_SELECT, saved.getValue().getQuestionType());
        assertEquals("A,C", saved.getValue().getCorrectOptionKey());
        assertEquals("Đúng", saved.getValue().getOptions().get(0).get("content"));
    }

    private QuizGenerateRequest request(int count, int multipleChoice, Integer multiSelect, int trueFalse, int fillBlank) {
        QuizGenerateRequest request = new QuizGenerateRequest();
        request.setTopic("Hàm số");
        request.setCount(count);
        request.setMinDifficulty(2);
        request.setMaxDifficulty(4);
        request.setMultipleChoice(multipleChoice);
        request.setMultiSelect(multiSelect);
        request.setTrueFalse(trueFalse);
        request.setFillBlank(fillBlank);
        return request;
    }

    private NormalizedQuestion draft() {
        return new NormalizedQuestion(
                "Chọn các đáp án đúng",
                "A và C đúng.",
                3,
                QuestionType.MULTI_SELECT,
                List.of("đại số"),
                List.of(
                        new ChoiceInput("A", "Đúng", true),
                        new ChoiceInput("B", "Sai", false),
                        new ChoiceInput("C", "Cũng đúng", true)),
                null);
    }
}
