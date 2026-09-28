package com.vn.aitutor.analytics;

import java.math.BigDecimal;
import java.util.List;

public final class ParentMessageComposer {

    public static final int MIN_LENGTH = 50;
    public static final int MAX_LENGTH = 1000;

    public static final String DEFAULT_TEMPLATE = "Kính gửi Quý phụ huynh,\n\n"
            + "Nhà trường trân trọng thông báo về tình hình tự học của em {studentName}. "
            + "{activitySentence} {scoreSentence} {gapSentence}\n\n"
            + "Kính mong Quý phụ huynh nhắc em dành thời gian ôn tập và liên hệ giáo viên chủ nhiệm khi cần hỗ trợ thêm.\n\n"
            + "Trân trọng,\n"
            + "{teacherName}\n"
            + "{schoolName}";

    private ParentMessageComposer() {}

    public static String compose(
            String studentName,
            Integer inactiveDays,
            BigDecimal averageScore,
            List<String> subjects,
            List<String> topics,
            String teacherName,
            String schoolName) {
        return compose(null, studentName, inactiveDays, averageScore, subjects, topics, teacherName, schoolName);
    }

    public static String compose(
            String template,
            String studentName,
            Integer inactiveDays,
            BigDecimal averageScore,
            List<String> subjects,
            List<String> topics,
            String teacherName,
            String schoolName) {
        String pattern = template == null || template.isBlank() ? DEFAULT_TEMPLATE : template;
        String name = blank(studentName) ? "học sinh" : studentName.trim();
        String teacher = blank(teacherName) ? "Giáo viên chủ nhiệm" : teacherName.trim();
        String school = blank(schoolName) ? "Nhà trường" : schoolName.trim();
        String subjectText = subjects == null || subjects.isEmpty() ? "" : String.join(", ", subjects);
        String topicText = topics == null || topics.isEmpty() ? "" : String.join(", ", topics);
        String days = inactiveDays == null ? "chưa ghi nhận" : Integer.toString(inactiveDays);
        String score = averageScore == null ? "chưa có" : averageScore.toPlainString();
        return pattern.replace("{studentName}", name)
                .replace("{inactiveDays}", days)
                .replace("{averageScore}", score)
                .replace("{subjects}", subjectText)
                .replace("{topics}", topicText)
                .replace("{activitySentence}", activitySentence(inactiveDays))
                .replace("{scoreSentence}", scoreSentence(averageScore))
                .replace("{gapSentence}", gapSentence(subjects, topics))
                .replace("{teacherName}", teacher)
                .replace("{schoolName}", school)
                .trim();
    }

    private static String activitySentence(Integer inactiveDays) {
        if (inactiveDays == null) {
            return "Em chưa ghi nhận lần mở ứng dụng tự học nào.";
        }
        return "Em đã không mở ứng dụng tự học trong " + inactiveDays + " ngày.";
    }

    private static String scoreSentence(BigDecimal averageScore) {
        if (averageScore == null) {
            return "Em chưa có bài trắc nghiệm trong kỳ này.";
        }
        return "Điểm trắc nghiệm trung bình trong kỳ là " + averageScore.toPlainString() + ".";
    }

    private static String gapSentence(List<String> subjects, List<String> topics) {
        if (topics == null || topics.isEmpty()) {
            return "Trong kỳ này nhà trường chưa ghi nhận chủ đề kiến thức bị hổng.";
        }
        String subjectText = subjects == null || subjects.isEmpty() ? "đang học" : String.join(", ", subjects);
        return "Em đang hổng kiến thức ở môn "
                + subjectText
                + ", cụ thể các chủ đề: "
                + String.join(", ", topics)
                + ".";
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
