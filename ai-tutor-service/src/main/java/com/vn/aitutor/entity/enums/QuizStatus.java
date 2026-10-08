package com.vn.aitutor.entity.enums;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.util.Locale;

public enum QuizStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED;

    public static QuizStatus parseFilter(String raw) {
        if (raw == null || raw.isBlank() || "ALL".equalsIgnoreCase(raw.trim())) {
            return null;
        }
        try {
            return QuizStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("Trạng thái đề thi không hợp lệ");
        }
    }
}
