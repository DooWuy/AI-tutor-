package com.vn.aitutor.service.quiz;

import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.enums.QuestionType;
import java.math.*;
import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class QuizGradingService {
    private static final int MAX_XP_PER_LEVEL = 1_000_000;
    private final int xpPerLevel;
    public QuizGradingService(@Value("${app.quiz.xp-per-level:100}") int xpPerLevel) {
        if (xpPerLevel <= 0 || xpPerLevel > MAX_XP_PER_LEVEL)
            throw new IllegalArgumentException("XP per level must be between 1 and " + MAX_XP_PER_LEVEL);
        this.xpPerLevel = xpPerLevel;
    }
    public boolean correct(QuizQuestion question, String value) {
        if (value == null || value.isBlank()) return false;
        QuestionType type = question.getType();
        if (type == QuestionType.FILL_BLANK)
            return normalize(value).equals(normalize(question.getCorrectOptionKey()));
        if (type == QuestionType.MULTI_SELECT)
            return choiceKeys(value).equals(choiceKeys(question.getCorrectOptionKey()));
        return value.equals(question.getCorrectOptionKey());
    }
    public static Set<String> choiceKeys(String raw) {
        if (raw == null || raw.isBlank()) return Set.of();
        Set<String> keys = new LinkedHashSet<>();
        for (String part : raw.split("[,;]")) {
            String token = part.trim();
            if (!token.isEmpty()) keys.add(token.toUpperCase(Locale.ROOT));
        }
        return Set.copyOf(keys);
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
    public int xpPerLevel() { return xpPerLevel; }

    public int level(int totalXp) {
        if (totalXp < 0) throw new IllegalArgumentException("Total XP must not be negative");
        return Math.addExact(totalXp / xpPerLevel, 1);
    }
}
