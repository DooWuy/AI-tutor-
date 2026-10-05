package com.vn.aitutor.entity.enums;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.util.Locale;

public enum DocumentType {
    THEORY("Tài liệu lý thuyết"),
    EXERCISE("Bài tập ôn luyện"),
    EXAM("Đề thi mẫu");

    private final String displayName;

    DocumentType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static DocumentType parseRequired(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResourceBadRequestException("Phân loại tài liệu không hợp lệ");
        }
        String trimmed = raw.trim();
        for (DocumentType type : values()) {
            if (type.name().equalsIgnoreCase(trimmed) || type.displayName.equalsIgnoreCase(trimmed)) {
                return type;
            }
        }
        throw new ResourceBadRequestException("Phân loại tài liệu không hợp lệ: " + raw);
    }

    public static DocumentType parseOrDefault(String raw, DocumentType fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
        return parseRequired(raw);
    }

    public static String normalizeKey(String raw) {
        return parseRequired(raw).name().toUpperCase(Locale.ROOT);
    }
}
