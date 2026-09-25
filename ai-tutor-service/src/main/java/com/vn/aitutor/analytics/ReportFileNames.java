package com.vn.aitutor.analytics;

public final class ReportFileNames {

    private ReportFileNames() {}

    public static String pdf(String className) {
        return "bao-cao-" + token(className) + ".pdf";
    }

    public static String excel(String className) {
        return "diem-" + token(className) + ".xlsx";
    }

    static String token(String className) {
        String folded = TopicText.fold(className == null ? "" : className);
        String cleaned = folded.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return cleaned.isBlank() ? "lop" : cleaned;
    }
}
