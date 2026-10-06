package com.vn.aitutor.curriculum;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.util.Locale;
import java.util.regex.Pattern;

public final class CurriculumCodes {

    private static final Pattern CODE = Pattern.compile("^[A-Z0-9_]{2,20}$");

    private CurriculumCodes() {
    }

    public static String normalize(String raw, String label) {
        if (raw == null || raw.isBlank()) {
            throw new ResourceBadRequestException(label + " không được để trống");
        }
        String upper = raw.trim().toUpperCase(Locale.ROOT);
        if (!CODE.matcher(upper).matches()) {
            throw new ResourceBadRequestException(
                    label + " chỉ gồm chữ, số và dấu gạch dưới, dài từ 2 đến 20 ký tự");
        }
        return upper;
    }

    public static String requireText(String raw, String label, int min, int max) {
        if (raw == null) {
            throw new ResourceBadRequestException(label + " không được để trống");
        }
        String trimmed = raw.trim();
        if (trimmed.length() < min || trimmed.length() > max) {
            throw new ResourceBadRequestException(
                    label + " phải dài từ " + min + " đến " + max + " ký tự");
        }
        return trimmed;
    }
}
