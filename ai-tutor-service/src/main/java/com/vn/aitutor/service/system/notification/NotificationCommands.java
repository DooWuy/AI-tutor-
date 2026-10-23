package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.entity.enums.NotificationChannel;
import com.vn.aitutor.entity.enums.NotificationSourceType;
import com.vn.aitutor.entity.enums.NotificationType;
import com.vn.aitutor.entity.enums.Role;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public final class NotificationCommands {
    public static final ZoneId REMINDER_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    private NotificationCommands() {}

    public static NotificationCommand classReminder(UUID userId, UUID scheduleId, UUID slotId,
            String subject, Instant startsAt, String room) {
        Objects.requireNonNull(scheduleId, "scheduleId");
        Objects.requireNonNull(slotId, "slotId");
        Objects.requireNonNull(startsAt, "startsAt");
        requireSubject(subject);
        var localStart = startsAt.atZone(REMINDER_ZONE);
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("scheduleId", scheduleId.toString());
        metadata.put("slotId", slotId.toString());
        metadata.put("subject", subject);
        metadata.put("startsAt", startsAt.toString());
        if (room != null && !room.isBlank()) metadata.put("room", room);
        return new NotificationCommand(userId, NotificationType.CLASS_REMINDER,
                "CLASS_REMINDER:" + slotId + ":" + localStart.toLocalDate(),
                NotificationSourceType.SCHEDULE_SLOT, slotId, startsAt,
                title("Sắp đến giờ học: " + subject),
                "Bạn có tiết học " + subject + " lúc " + TIME.format(localStart) + ". Hãy chuẩn bị nhé!",
                NotificationLinks.timetable(), metadata,
                Set.of(NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL), startsAt);
    }

    public static NotificationCommand quizResult(UUID userId, Role role, UUID quizId,
            UUID jobId, String subject, boolean success) {
        Objects.requireNonNull(quizId, "quizId");
        var type = success ? NotificationType.QUIZ_GENERATED : NotificationType.QUIZ_GENERATION_FAILED;
        var source = jobId == null ? NotificationSourceType.QUIZ : NotificationSourceType.GENERATION_JOB;
        UUID sourceId = jobId == null ? quizId : jobId;
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("quizId", quizId.toString());
        if (jobId != null) metadata.put("jobId", jobId.toString());
        if (subject != null && !subject.isBlank()) metadata.put("subject", subject);
        return new NotificationCommand(userId, type, type + ":" + source + ":" + sourceId,
                source, sourceId, null,
                success ? "Đã tạo xong bài trắc nghiệm" : "Chưa tạo được bài trắc nghiệm",
                success ? "Bài trắc nghiệm của bạn đã được tạo xong."
                        : "Không thể hoàn tất tạo bài trắc nghiệm. Bạn có thể mở lại để thử lại.",
                NotificationLinks.quiz(role, quizId, subject), metadata,
                Set.of(NotificationChannel.WEBSOCKET), null);
    }

    private static void requireSubject(String subject) {
        if (subject == null || subject.isBlank() || subject.length() > 255) {
            throw new IllegalArgumentException("Invalid notification subject");
        }
    }

    private static String title(String value) {
        return value.length() <= 255 ? value : value.substring(0, 254) + "…";
    }
}
