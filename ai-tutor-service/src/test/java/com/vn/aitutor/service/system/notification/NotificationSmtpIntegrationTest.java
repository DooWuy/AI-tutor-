package com.vn.aitutor.service.system.notification;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import com.vn.aitutor.dto.response.notification.NotificationResponse;
import com.vn.aitutor.entity.enums.NotificationChannel;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers(disabledWithoutDocker = true)
class NotificationSmtpIntegrationTest {
    private static final Instant NOW = Instant.parse("2026-10-23T01:00:00Z");

    @Container
    static final GenericContainer<?> SMTP = new GenericContainer<>(DockerImageName.parse("axllent/mailpit:v1.27.6"))
            .withExposedPorts(1025, 8025);

    @Test
    void sendsReminderThroughSmtpAndPropagatesARealConnectionFailure() throws Exception {
        var mail = mailSender(SMTP.getHost(), SMTP.getMappedPort(1025));
        var sender = new NotificationDeliverySender(mock(SimpMessagingTemplate.class), mail,
                "noreply@aitutor.test", Clock.fixed(NOW, ZoneOffset.UTC));

        sender.send(sample());

        var request = HttpRequest.newBuilder(URI.create("http://" + SMTP.getHost() + ":"
                + SMTP.getMappedPort(8025) + "/api/v1/messages")).GET().build();
        String messages = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString()).body();
        assertTrue(messages.contains("student@example.test"));
        assertTrue(messages.contains("Sắp đến giờ học"));

        var unavailable = new NotificationDeliverySender(mock(SimpMessagingTemplate.class),
                mailSender("127.0.0.1", 1), "noreply@aitutor.test", Clock.fixed(NOW, ZoneOffset.UTC));
        assertThrows(MailException.class, () -> unavailable.send(sample()));
    }

    private static JavaMailSenderImpl mailSender(String host, int port) {
        var mail = new JavaMailSenderImpl();
        mail.setHost(host);
        mail.setPort(port);
        mail.setDefaultEncoding("UTF-8");
        mail.getJavaMailProperties().put("mail.smtp.connectiontimeout", "2000");
        mail.getJavaMailProperties().put("mail.smtp.timeout", "2000");
        mail.getJavaMailProperties().put("mail.smtp.writetimeout", "2000");
        return mail;
    }

    private static PreparedDelivery sample() {
        UUID notificationId = UUID.randomUUID();
        var notification = new NotificationResponse(notificationId, "CLASS_REMINDER", "Sắp đến giờ học: Toán",
                "Bạn có tiết học Toán lúc 08:15. Hãy chuẩn bị nhé!", "/student/timetable", false, NOW,
                Map.of("room", "A1", "startsAt", NOW.plusSeconds(900).toString()));
        var claim = new DeliveryClaim(UUID.randomUUID(), notificationId, NotificationChannel.EMAIL,
                UUID.randomUUID(), 1, NOW.plusSeconds(120));
        return new PreparedDelivery(claim, notification, "student", "student@example.test",
                "Nguyễn Văn An", NOW.plusSeconds(900));
    }
}
