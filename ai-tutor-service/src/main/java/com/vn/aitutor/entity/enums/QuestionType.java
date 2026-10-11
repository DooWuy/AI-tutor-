package com.vn.aitutor.entity.enums;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.util.Locale;

public enum QuestionType {
    MULTIPLE_CHOICE,
    TRUE_FALSE,
    FILL_BLANK;

    public static QuestionType parseOrDefault(String raw) {
        if (raw == null || raw.isBlank()) {
            return MULTIPLE_CHOICE;
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        if ("FILL_IN_BLANK".equals(normalized) || "SHORT_ANSWER".equals(normalized)) {
            return FILL_BLANK;
        }
        try {
            return QuestionType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("Loại câu hỏi không hợp lệ");
        }
    }
}
