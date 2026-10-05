package com.vn.aitutor.entity.enums;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.util.Arrays;
import java.util.Locale;

public enum SubjectCode {
    TOAN("Toán"),
    LY("Vật lý"),
    HOA("Hóa học"),
    SINH("Sinh học"),
    ANH("Tiếng Anh"),
    VAN("Ngữ văn"),
    SU("Lịch sử"),
    DIA("Địa lý"),
    GDCD("GDCD"),
    TIN("Tin học");

    private final String displayName;

    SubjectCode(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static final String ALL = "ALL";

    public static boolean isAll(String raw) {
        return raw == null || raw.isBlank() || ALL.equalsIgnoreCase(raw.trim());
    }

    public static SubjectCode parseRequired(String raw) {
        if (isAll(raw)) {
            throw new ResourceBadRequestException("Môn học không hợp lệ");
        }
        String trimmed = raw.trim();
        for (SubjectCode code : values()) {
            if (code.name().equalsIgnoreCase(trimmed) || code.displayName.equalsIgnoreCase(trimmed)) {
                return code;
            }
        }
        try {
            return SubjectCode.valueOf(trimmed.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("Môn học không hợp lệ: " + raw);
        }
    }

    public static String normalizeFilter(String raw) {
        if (isAll(raw)) {
            return null;
        }
        return parseRequired(raw).name();
    }

    public static boolean isKnown(String raw) {
        if (isAll(raw)) {
            return true;
        }
        return Arrays.stream(values()).anyMatch(v -> v.name().equalsIgnoreCase(raw.trim()));
    }
}
