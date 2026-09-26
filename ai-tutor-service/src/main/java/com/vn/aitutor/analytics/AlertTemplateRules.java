package com.vn.aitutor.analytics;

import com.vn.aitutor.exception.ResourceBadRequestException;

public final class AlertTemplateRules {

    public static final int MIN_LENGTH = 50;
    public static final int MAX_LENGTH = 2000;

    private AlertTemplateRules() {}

    public static String validate(String template) {
        if (template == null || template.isBlank()) {
            throw new ResourceBadRequestException("Mẫu tin nhắn không được để trống");
        }
        String trimmed = template.trim();
        if (trimmed.length() < MIN_LENGTH || trimmed.length() > MAX_LENGTH) {
            throw new ResourceBadRequestException("Mẫu tin nhắn phải từ 50 đến 2000 ký tự");
        }
        boolean hasDays = trimmed.contains("{inactiveDays}") || trimmed.contains("{activitySentence}");
        boolean hasGaps = trimmed.contains("{topics}")
                || trimmed.contains("{subjects}")
                || trimmed.contains("{gapSentence}");
        if (!trimmed.contains("{studentName}") || !hasDays || !hasGaps) {
            throw new ResourceBadRequestException(
                    "Mẫu tin nhắn phải có {studentName}, {inactiveDays} hoặc {activitySentence}, và {topics}, {subjects} hoặc {gapSentence}");
        }
        return trimmed;
    }
}
