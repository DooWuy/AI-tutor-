package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.entity.enums.Role;
import java.util.Objects;
import java.util.UUID;
import org.springframework.web.util.UriUtils;
import java.nio.charset.StandardCharsets;

public final class NotificationLinks {
    private NotificationLinks() {}

    public static String timetable() {
        return "/student/timetable";
    }

    public static String teacherStudyClass(UUID classId) {
        return "/teacher/study-classes/" + Objects.requireNonNull(classId, "classId");
    }

    public static String studentStudyClass(UUID classId) {
        return "/student/classes/" + Objects.requireNonNull(classId, "classId");
    }

    public static String quiz(Role role, UUID quizId, String subject) {
        Objects.requireNonNull(role, "role");
        Objects.requireNonNull(quizId, "quizId");
        return switch (role) {
            case STUDENT -> {
                if (subject == null || subject.isBlank()) {
                    throw new IllegalArgumentException("Student quiz notification requires a subject");
                }
                yield "/student/practice/" + UriUtils.encodePathSegment(subject, StandardCharsets.UTF_8);
            }
            case TEACHER -> "/teacher/quizzes/" + quizId;
            case ADMIN -> "/admin/quizzes/" + quizId;
        };
    }
}
