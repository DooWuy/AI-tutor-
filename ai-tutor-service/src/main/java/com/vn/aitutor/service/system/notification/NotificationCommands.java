package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.entity.enums.NotificationChannel;
import com.vn.aitutor.entity.enums.NotificationSourceType;
import com.vn.aitutor.entity.enums.NotificationType;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
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

    public static NotificationCommand studyClassJoinRequested(UUID teacherUserId, UUID classId,
            UUID enrollmentId, UUID studentId, String className, String studentName, Instant requestedAt) {
        String safeClassName = requireStudyClassEvent(classId, enrollmentId, className, requestedAt);
        Objects.requireNonNull(studentId, "studentId");
        String safeStudentName = requireText(studentName, 255, "studentName");
        Map<String, Object> metadata = studyClassMetadata(
                classId, enrollmentId, safeClassName, EnrollmentStatus.PENDING);
        metadata.put("studentId", studentId.toString());
        metadata.put("studentName", safeStudentName);
        return new NotificationCommand(teacherUserId, NotificationType.STUDY_CLASS_JOIN_REQUESTED,
                studyClassEventKey(NotificationType.STUDY_CLASS_JOIN_REQUESTED, enrollmentId, requestedAt),
                NotificationSourceType.STUDY_CLASS_ENROLLMENT, enrollmentId, requestedAt,
                title("Yêu cầu tham gia " + safeClassName),
                safeStudentName + " đã gửi yêu cầu tham gia lớp " + safeClassName + ".",
                NotificationLinks.teacherStudyClass(classId), metadata,
                Set.of(NotificationChannel.WEBSOCKET), null);
    }

    public static NotificationCommand studyClassJoinResult(UUID studentUserId, UUID classId,
            UUID enrollmentId, String className, EnrollmentStatus status, Instant requestedAt) {
        String safeClassName = requireStudyClassEvent(classId, enrollmentId, className, requestedAt);
        if (status != EnrollmentStatus.APPROVED && status != EnrollmentStatus.REJECTED) {
            throw new IllegalArgumentException("Study class result status must be APPROVED or REJECTED");
        }
        NotificationType type = status == EnrollmentStatus.APPROVED
                ? NotificationType.STUDY_CLASS_JOIN_APPROVED
                : NotificationType.STUDY_CLASS_JOIN_REJECTED;
        boolean approved = status == EnrollmentStatus.APPROVED;
        return new NotificationCommand(studentUserId, type,
                studyClassEventKey(type, enrollmentId, requestedAt),
                NotificationSourceType.STUDY_CLASS_ENROLLMENT, enrollmentId, requestedAt,
                approved ? title("Đã được duyệt vào lớp " + safeClassName)
                        : title("Yêu cầu vào lớp " + safeClassName + " bị từ chối"),
                approved ? "Bạn đã được chấp nhận vào lớp " + safeClassName + "."
                        : "Giáo viên đã từ chối yêu cầu tham gia lớp " + safeClassName + ".",
                NotificationLinks.studentStudyClass(classId),
                studyClassMetadata(classId, enrollmentId, safeClassName, status),
                Set.of(NotificationChannel.WEBSOCKET), null);
    }

    private static Map<String, Object> studyClassMetadata(UUID classId, UUID enrollmentId,
            String className, EnrollmentStatus status) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("classId", classId.toString());
        metadata.put("enrollmentId", enrollmentId.toString());
        metadata.put("className", requireText(className, 64, "className"));
        metadata.put("enrollmentStatus", status.name());
        return metadata;
    }

    private static String requireStudyClassEvent(UUID classId, UUID enrollmentId,
            String className, Instant requestedAt) {
        Objects.requireNonNull(classId, "classId");
        Objects.requireNonNull(enrollmentId, "enrollmentId");
        Objects.requireNonNull(requestedAt, "requestedAt");
        return requireText(className, 64, "className");
    }

    private static String studyClassEventKey(NotificationType type, UUID enrollmentId, Instant requestedAt) {
        return type + ":" + enrollmentId + ":" + requestedAt;
    }

    private static void requireSubject(String subject) {
        if (subject == null || subject.isBlank() || subject.length() > 255) {
            throw new IllegalArgumentException("Invalid notification subject");
        }
    }

    private static String requireText(String value, int maxLength, String name) {
        if (value == null || value.isBlank() || value.length() > maxLength) {
            throw new IllegalArgumentException("Invalid notification " + name);
        }
        return value.trim();
    }

    private static String title(String value) {
        return value.length() <= 255 ? value : value.substring(0, 254) + "…";
    }
}
