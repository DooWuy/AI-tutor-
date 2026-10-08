package com.vn.aitutor.quiz;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.dto.request.QuizUpsertRequest;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.exception.ResourceBadRequestException;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class QuestionContentRulesTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsShortStemSingleChoiceAndTwoCorrectAnswers() {
        ResourceBadRequestException shortStem = assertThrows(ResourceBadRequestException.class, () -> QuestionContentRules.require(
                "ngắn",
                "Lời giải thích đủ dài cho học sinh.",
                QuestionType.MULTIPLE_CHOICE,
                fourChoices(),
                List.of(),
                3,
                null,
                null,
                false));
        assertTrue(shortStem.getMessage().contains("Nội dung câu hỏi"));

        ResourceBadRequestException oneChoice = assertThrows(ResourceBadRequestException.class, () -> QuestionContentRules.require(
                "Câu hỏi này đã đủ mười ký tự.",
                "Lời giải thích đủ dài cho học sinh.",
                QuestionType.MULTIPLE_CHOICE,
                List.of(new ChoiceInput("A", "Một", true)),
                List.of(),
                3,
                null,
                null,
                false));
        assertTrue(oneChoice.getMessage().contains("phương án"));

        ResourceBadRequestException twoCorrect = assertThrows(ResourceBadRequestException.class, () -> QuestionContentRules.require(
                "Câu hỏi này đã đủ mười ký tự.",
                "Lời giải thích đủ dài cho học sinh.",
                QuestionType.MULTIPLE_CHOICE,
                List.of(
                        new ChoiceInput("A", "Một", true),
                        new ChoiceInput("B", "Hai", true)),
                List.of(),
                3,
                null,
                null,
                false));
        assertTrue(twoCorrect.getMessage().contains("một đáp án đúng"));
    }

    @Test
    void rejectsGenerateCountAboveTwenty() {
        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class, () -> QuestionContentRules.requireGenerateCount(21));
        assertTrue(error.getMessage().contains("1 đến 20"));
    }

    @Test
    void rejectsQuizTimeAndPassingScoreOutsideRange() {
        QuizUpsertRequest request = new QuizUpsertRequest();
        request.setTitle("Đề");
        request.setSubject("TOAN");
        request.setGradeLevel("12");
        request.setTimeLimitMinutes(0);
        request.setMaxAttempts(3);
        request.setPassingScore(new BigDecimal("101"));
        Set<String> fields = validator.validate(request).stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());
        assertTrue(fields.contains("timeLimitMinutes"));
        assertTrue(fields.contains("passingScore"));
    }

    private static List<ChoiceInput> fourChoices() {
        return List.of(
                new ChoiceInput("A", "Một", true),
                new ChoiceInput("B", "Hai", false),
                new ChoiceInput("C", "Ba", false),
                new ChoiceInput("D", "Bốn", false));
    }
}
