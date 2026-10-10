package com.vn.aitutor.service;

import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.enums.QuestionType;
import java.math.*;
import java.text.Normalizer;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class QuizGradingService {
    private final int xpPerLevel;
    public QuizGradingService(@Value("${app.quiz.xp-per-level:100}") int xpPerLevel) {
        if (xpPerLevel <= 0) throw new IllegalArgumentException("XP per level must be positive");
        this.xpPerLevel = xpPerLevel;
    }
    public boolean correct(QuizQuestion question, String value) {
        if (value == null || value.isBlank()) return false;
        QuestionType type = question.getType();
        if (type == QuestionType.FILL_IN_BLANK || type == QuestionType.SHORT_ANSWER)
            return normalize(value).equals(normalize(question.getCorrectOptionKey()));
        return value.equals(question.getCorrectOptionKey());
    }
    private String normalize(String text) {
        if (text == null) return "";
        return Normalizer.normalize(text, Normalizer.Form.NFC)
                .replaceAll("(?U)\\s+", " ").strip().toLowerCase(Locale.ROOT);
    }
    public double score(int correct, int total) {
        if (total <= 0) throw new IllegalArgumentException("Quiz must have questions");
        return BigDecimal.valueOf(correct * 10L).divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP).doubleValue();
    }
    public int level(int totalXp) { return totalXp / xpPerLevel + 1; }
}
