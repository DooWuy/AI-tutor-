package com.vn.aitutor.service.system.notification;

import static org.junit.jupiter.api.Assertions.*;

import com.vn.aitutor.dto.response.notification.NotificationResponse;
import com.vn.aitutor.entity.Notification;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.NotificationChannel;
import com.vn.aitutor.entity.enums.NotificationSourceType;
import com.vn.aitutor.entity.enums.NotificationType;
import com.vn.aitutor.entity.enums.Role;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.messaging.MessageHeaders;
import org.springframework.messaging.converter.JacksonJsonMessageConverter;
import org.springframework.mock.http.MockHttpOutputMessage;
import tools.jackson.databind.json.JsonMapper;

class NotificationContractTest {
    private final UUID userId = UUID.randomUUID();
    private final UUID quizId = UUID.randomUUID();

    @Test void publicPayloadUsesIsReadAndNeverSerializesPersistenceFields() {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUser(new User());
        notification.setTitle("Thông báo");
        notification.setMessage("Nội dung");
        notification.setType("CLASS_REMINDER");
        notification.setRead(true);
        notification.setCreatedAt(Instant.parse("2026-10-21T00:00:00Z"));
        notification.setEventKey("internal-key");
        notification.setMetadata(Map.of("subject", "Toán"));
        var mapper = JsonMapper.builder().build();
        var json = mapper.readTree(mapper.writeValueAsString(NotificationResponse.from(notification)));
        assertEquals(8, json.size());
        assertTrue(json.get("isRead").asBoolean());
        assertFalse(json.has("read"));
        assertFalse(json.has("user"));
        assertFalse(json.has("eventKey"));
        assertEquals("Toán", json.get("metadata").get("subject").asString());
        assertEquals("2026-10-21T00:00:00Z", json.get("createdAt").asString());
    }

    @Test void oldNotificationsKeepTheirTypeAndHaveEmptyMetadata() {
        Notification legacy = new Notification();
        legacy.setType("LEGACY_TYPE");
        legacy.setMetadata(null);
        assertEquals("LEGACY_TYPE", NotificationResponse.from(legacy).type());
        assertEquals(Map.of(), NotificationResponse.from(legacy).metadata());
    }

    @Test void actualRestAndStompConvertersProduceTheSameContract() throws Exception {
        var dto = new NotificationResponse(UUID.randomUUID(), "QUIZ_GENERATED", "Đã tạo xong", "Nội dung",
                "/student/practice/MATH", true, Instant.parse("2026-10-21T00:00:00Z"), Map.of("quizId", quizId.toString()));
        var output = new MockHttpOutputMessage();
        new JacksonJsonHttpMessageConverter().write(dto, MediaType.APPLICATION_JSON, output);
        var stomp = new JacksonJsonMessageConverter().toMessage(dto,
                new MessageHeaders(Map.of(MessageHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON)));
        assertNotNull(stomp);
        var mapper = JsonMapper.builder().build();
        var restJson = mapper.readTree(output.getBodyAsBytes());
        var stompJson = mapper.readTree((byte[]) stomp.getPayload());
        assertEquals(restJson, stompJson);
        assertTrue(restJson.get("isRead").asBoolean());
        assertFalse(restJson.has("read"));
    }

    @Test void linksEncodeStudentSubjectAsOnePathSegmentAndUseRoleSpecificEditors() {
        assertEquals("/student/practice/To%C3%A1n%20%2F%20%3F%23%25", NotificationLinks.quiz(Role.STUDENT, quizId, "Toán / ?#%"));
        assertEquals("/teacher/quizzes/" + quizId, NotificationLinks.quiz(Role.TEACHER, quizId, null));
        assertEquals("/admin/quizzes/" + quizId, NotificationLinks.quiz(Role.ADMIN, quizId, null));
        assertThrows(IllegalArgumentException.class, () -> NotificationLinks.quiz(Role.STUDENT, quizId, " "));
    }

    @Test void reminderKeyUsesVietnamOccurrenceDateAndIncludesBothChannels() {
        UUID slotId = UUID.randomUUID();
        UUID scheduleId = UUID.randomUUID();
        Instant startsAt = Instant.parse("2026-10-25T17:05:00Z"); // Monday 00:05 in Vietnam
        var reminder = NotificationCommands.classReminder(userId, scheduleId, slotId, "Toán", startsAt, "A1");
        assertEquals("CLASS_REMINDER:" + slotId + ":2026-10-26", reminder.eventKey());
        assertEquals("/student/timetable", reminder.link());
        assertEquals(startsAt, reminder.expiresAt());
        assertEquals(Set.of(NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET), reminder.channels());
        assertEquals("A1", reminder.metadata().get("room"));
        assertTrue(reminder.message().contains("00:05"));
        assertFalse(reminder.message().contains("15 phút"));
        assertEquals(reminder.eventKey(), NotificationCommands.classReminder(userId, scheduleId, slotId,
                "Toán", startsAt.plusSeconds(60), null).eventKey());
        assertNotEquals(reminder.eventKey(), NotificationCommands.classReminder(userId, scheduleId, slotId,
                "Toán", startsAt.plusSeconds(86400), null).eventKey());
    }

    @Test void quizResultDistinguishesOutcomesAndSeparateGenerationRequests() {
        UUID firstJob = UUID.randomUUID();
        var success = NotificationCommands.quizResult(userId, Role.TEACHER, quizId, firstJob, "Toán", true);
        var failure = NotificationCommands.quizResult(userId, Role.TEACHER, quizId, firstJob, "Toán", false);
        var next = NotificationCommands.quizResult(userId, Role.TEACHER, quizId, UUID.randomUUID(), "Toán", true);
        assertEquals(NotificationType.QUIZ_GENERATED, success.type());
        assertEquals(NotificationType.QUIZ_GENERATION_FAILED, failure.type());
        assertNotEquals(success.eventKey(), failure.eventKey());
        assertNotEquals(success.eventKey(), next.eventKey());
        assertEquals(Set.of(NotificationChannel.WEBSOCKET), success.channels());
        assertNull(success.expiresAt());
        assertEquals(firstJob.toString(), success.metadata().get("jobId"));
        var student = NotificationCommands.quizResult(userId, Role.STUDENT, quizId, null, "MATH", true);
        assertEquals(quizId, student.sourceId());
        assertFalse(student.metadata().containsKey("jobId"));
    }

    @Test void longValidSubjectFitsTitleColumnAndMetadataCannotBeMutated() {
        var reminder = NotificationCommands.classReminder(userId, UUID.randomUUID(), UUID.randomUUID(),
                "A".repeat(255), Instant.now(), null);
        assertEquals(255, reminder.title().length());
        assertThrows(UnsupportedOperationException.class, () -> reminder.metadata().put("subject", "changed"));
    }

    @Test void studyClassJoinRequestUsesTeacherRecipientAndTrustedMetadata() {
        UUID classId = UUID.randomUUID();
        UUID enrollmentId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        Instant requestedAt = Instant.parse("2026-10-24T08:15:30Z");

        var command = NotificationCommands.studyClassJoinRequested(userId, classId, enrollmentId,
                studentId, "  Lớp Toán 5A  ", "  Nguyễn An  ", requestedAt);

        assertEquals(userId, command.userId());
        assertEquals(NotificationType.STUDY_CLASS_JOIN_REQUESTED, command.type());
        assertEquals(NotificationSourceType.STUDY_CLASS_ENROLLMENT, command.sourceType());
        assertEquals(enrollmentId, command.sourceId());
        assertEquals(requestedAt, command.occurrenceAt());
        assertNull(command.expiresAt());
        assertEquals(Set.of(NotificationChannel.WEBSOCKET), command.channels());
        assertEquals("/teacher/study-classes/" + classId, command.link());
        assertEquals(classId.toString(), command.metadata().get("classId"));
        assertEquals(enrollmentId.toString(), command.metadata().get("enrollmentId"));
        assertEquals(studentId.toString(), command.metadata().get("studentId"));
        assertEquals("Lớp Toán 5A", command.metadata().get("className"));
        assertEquals("Nguyễn An", command.metadata().get("studentName"));
        assertEquals("PENDING", command.metadata().get("enrollmentStatus"));
        assertFalse(command.metadata().containsKey("email"));
        assertTrue(command.title().contains("Lớp Toán 5A"));
        assertTrue(command.message().contains("Nguyễn An"));
    }

    @Test void studyClassResultDistinguishesApprovalRejectionAndRequestCycles() {
        UUID classId = UUID.randomUUID();
        UUID enrollmentId = UUID.randomUUID();
        Instant firstRequest = Instant.parse("2026-10-24T08:15:30Z");
        Instant nextRequest = firstRequest.plusSeconds(60);

        var approved = NotificationCommands.studyClassJoinResult(userId, classId, enrollmentId,
                "Lớp Toán 5A", EnrollmentStatus.APPROVED, firstRequest);
        var approvedReplay = NotificationCommands.studyClassJoinResult(userId, classId, enrollmentId,
                "Lớp Toán 5A", EnrollmentStatus.APPROVED, firstRequest);
        var rejected = NotificationCommands.studyClassJoinResult(userId, classId, enrollmentId,
                "Lớp Toán 5A", EnrollmentStatus.REJECTED, firstRequest);
        var nextCycle = NotificationCommands.studyClassJoinResult(userId, classId, enrollmentId,
                "Lớp Toán 5A", EnrollmentStatus.APPROVED, nextRequest);

        assertEquals(NotificationType.STUDY_CLASS_JOIN_APPROVED, approved.type());
        assertEquals(NotificationType.STUDY_CLASS_JOIN_REJECTED, rejected.type());
        assertEquals(approved.eventKey(), approvedReplay.eventKey());
        assertNotEquals(approved.eventKey(), rejected.eventKey());
        assertNotEquals(approved.eventKey(), nextCycle.eventKey());
        assertTrue(approved.eventKey().contains(enrollmentId.toString()));
        assertTrue(approved.eventKey().contains(firstRequest.toString()));
        assertEquals("/student/classes/" + classId, approved.link());
        assertEquals("APPROVED", approved.metadata().get("enrollmentStatus"));
        assertEquals("REJECTED", rejected.metadata().get("enrollmentStatus"));
        assertTrue(approved.message().contains("được chấp nhận"));
        assertTrue(rejected.message().contains("từ chối"));
        assertThrows(IllegalArgumentException.class, () -> NotificationCommands.studyClassJoinResult(
                userId, classId, enrollmentId, "Lớp Toán 5A", EnrollmentStatus.PENDING, firstRequest));
    }

    @Test void notificationCommandRejectsMismatchedStudyClassContracts() {
        UUID enrollmentId = UUID.randomUUID();
        Instant requestedAt = Instant.parse("2026-10-24T08:15:30Z");
        Map<String, Object> metadata = Map.of("enrollmentId", enrollmentId.toString());

        assertThrows(IllegalArgumentException.class, () -> new NotificationCommand(userId,
                NotificationType.STUDY_CLASS_JOIN_REQUESTED, "event", NotificationSourceType.STUDY_CLASS_ENROLLMENT,
                enrollmentId, requestedAt, "Title", "Message", "/teacher/classes", metadata,
                Set.of(NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL), null));
        assertThrows(IllegalArgumentException.class, () -> new NotificationCommand(userId,
                NotificationType.STUDY_CLASS_JOIN_APPROVED, "event", NotificationSourceType.STUDY_CLASS_ENROLLMENT,
                enrollmentId, null, "Title", "Message", "/student/classes", metadata,
                Set.of(NotificationChannel.WEBSOCKET), null));
        assertThrows(IllegalArgumentException.class, () -> new NotificationCommand(userId,
                NotificationType.QUIZ_GENERATED, "event", NotificationSourceType.STUDY_CLASS_ENROLLMENT,
                enrollmentId, null, "Title", "Message", "/teacher/quizzes/1", metadata,
                Set.of(NotificationChannel.WEBSOCKET), null));
    }
}
