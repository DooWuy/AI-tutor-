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
        try {
            return QuestionType.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("Loại câu hỏi không hợp lệ");
        }
    }
}
