package com.vn.aitutor.service;

import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.enums.QuestionType;
import java.text.Normalizer;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class QuizGradingServiceTest {
    private final QuizGradingService grading = new QuizGradingService(100);
    @Test void gradesAllTypesAndKeepsVietnameseAccents() {
        for (QuestionType type : QuestionType.values()) {
            QuizQuestion q = new QuizQuestion(); q.setType(type);
            boolean choice = type == QuestionType.MULTIPLE_CHOICE || type == QuestionType.TRUE_FALSE
                    || type == QuestionType.MULTI_SELECT;
            q.setCorrectOptionKey(choice ? "B" : "Hà Nội");
            assertTrue(grading.correct(q, choice ? "B" : "  HÀ\t NỘI  "));
            assertFalse(grading.correct(q, null)); assertFalse(grading.correct(q, "   "));
            assertFalse(grading.correct(q, "Ha Noi"));
        }
        QuizQuestion q = new QuizQuestion(); q.setType(QuestionType.FILL_BLANK); q.setCorrectOptionKey("Hà Nội");
        assertTrue(grading.correct(q, Normalizer.normalize("Hà Nội", Normalizer.Form.NFD)));
        assertTrue(grading.correct(q, "\u00a0Hà\u00a0Nội\u00a0"));
    }
    @Test void multiSelectMatchesTheWholeSet() {
        QuizQuestion question = new QuizQuestion();
        question.setType(QuestionType.MULTI_SELECT);
        question.setCorrectOptionKey("A,C");
        assertTrue(grading.correct(question, "C, A"));
        assertTrue(grading.correct(question, "a;c"));
        assertFalse(grading.correct(question, "A"));
        assertFalse(grading.correct(question, "A,B,C"));
    }
    @Test void scoreAndLevelBoundaries() {
        assertEquals(0.0, grading.score(0, 10)); assertEquals(7.0, grading.score(7, 10));
        assertEquals(10.0, grading.score(10, 10)); assertEquals(6.7, grading.score(2, 3));
        assertEquals(1, grading.level(99)); assertEquals(2, grading.level(100));
        assertEquals(2, grading.level(199)); assertEquals(3, grading.level(200));
        assertThrows(IllegalArgumentException.class, () -> grading.score(0, 0));
    }
}
