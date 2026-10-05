package com.vn.aitutor.curriculum;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.util.Set;

public final class GradeLevels {

    public static final Set<String> ALLOWED = Set.of("10", "11", "12");

    private GradeLevels() {
    }

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResourceBadRequestException("Khối lớp không hợp lệ. Chỉ chấp nhận Lớp 10, Lớp 11, Lớp 12");
        }
        String trimmed = raw.trim();
        String digits = trimmed.replaceFirst("(?i)^(lớp|khối)\\s*", "").trim();
        if (!ALLOWED.contains(digits)) {
            throw new ResourceBadRequestException("Khối lớp không hợp lệ. Chỉ chấp nhận Lớp 10, Lớp 11, Lớp 12");
        }
        return digits;
    }
}
