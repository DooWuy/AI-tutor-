package com.vn.aitutor.notification;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ReminderCopy {

    private static final DateTimeFormatter CLOCK = DateTimeFormatter.ofPattern("HH:mm");

    private ReminderCopy() {
    }

    public record ReminderText(String title, String body, String deepLink, List<String> outline) {
    }

    public static ReminderText compose(
            String fullName,
            String subjectName,
            LocalTime start,
            String room,
            List<String> weakTopics,
            UUID notificationId,
            int leadMinutes
    ) {
        String subject = blankTo(subjectName, "môn học");
        List<String> topics = weakTopics == null
                ? List.of()
                : weakTopics.stream().filter(topic -> topic != null && !topic.isBlank()).toList();
        String roomPart = room == null || room.isBlank() ? "" : " tại " + room.trim();
        String gapPart = topics.isEmpty() ? "" : " Nên xem lại: " + String.join(", ", topics) + ".";
        String deepLink = "/student/review/" + notificationId;

        List<String> outline = new ArrayList<>();
        outline.add("Nhắc lại mục tiêu tiết " + subject + " trước khi vào lớp.");
        if (topics.isEmpty()) {
            outline.add("Xem lại khái niệm chính của môn " + subject + ".");
        } else {
            outline.add("Xem lại " + String.join(", ", topics) + " — phần bạn đang sai nhiều hơn đúng.");
        }
        outline.add("Làm ba câu tự kiểm tra trước khi vào lớp.");

        return new ReminderText(
                "Còn " + leadMinutes + " phút — " + subject,
                givenName(fullName) + " ơi, tiết " + subject + " bắt đầu lúc " + CLOCK.format(start) + roomPart
                        + ". Mở bài ôn nhanh trước khi vào lớp." + gapPart,
                deepLink,
                List.copyOf(outline)
        );
    }

    public static String preview(String subjectName, LocalTime start, String room) {
        String subject = blankTo(subjectName, "môn học");
        String roomPart = room == null || room.isBlank() ? "" : " tại " + room.trim();
        return "Chuẩn bị vào tiết " + subject + " lúc " + CLOCK.format(start) + roomPart;
    }

    static String givenName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "bạn";
        }
        String trimmed = fullName.trim().replaceAll("\\s+", " ");
        String[] parts = trimmed.split(" ");
        String last = parts[parts.length - 1];
        if (last.length() >= 2) {
            return last;
        }
        return trimmed;
    }

    private static String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
