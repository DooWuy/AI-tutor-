package com.vn.aitutor.analytics;

import java.text.Normalizer;
import java.util.Locale;

public final class TopicText {

    private TopicText() {}

    public static String fold(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String replaced = raw.replace('đ', 'd').replace('Đ', 'D');
        String decomposed = Normalizer.normalize(replaced, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT).trim();
    }

    public static boolean containsTopic(String content, String topic) {
        String foldedTopic = fold(topic);
        if (foldedTopic.isEmpty()) {
            return false;
        }
        return fold(content).contains(foldedTopic);
    }

    public static String clip(String content, int max) {
        if (content == null) {
            return "";
        }
        String trimmed = content.replaceAll("\\s+", " ").trim();
        if (trimmed.length() <= max) {
            return trimmed;
        }
        return trimmed.substring(0, max);
    }
}
