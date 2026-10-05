package com.vn.aitutor.entity.enums;

import com.vn.aitutor.exception.ResourceBadRequestException;

public enum TocExtractionMethod {
    AI,
    OCR;

    public static TocExtractionMethod parseRequired(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResourceBadRequestException("Phương pháp trích xuất không hợp lệ. Chọn AI hoặc OCR");
        }
        try {
            return TocExtractionMethod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("Phương pháp trích xuất không hợp lệ. Chọn AI hoặc OCR");
        }
    }
}
