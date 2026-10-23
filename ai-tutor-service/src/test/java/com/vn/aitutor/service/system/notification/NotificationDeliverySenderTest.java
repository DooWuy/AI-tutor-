package com.vn.aitutor.service.system.notification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.response.notification.NotificationResponse;
import com.vn.aitutor.entity.enums.NotificationChannel;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;

class NotificationDeliverySenderTest {
    private static final Instant NOW = Instant.parse("2026-10-21T00:00:00Z");
    private final java.time.Clock clock = java.time.Clock.fixed(NOW, java.time.ZoneOffset.UTC);
    @Test void emailUsesAccountAddressAndActualStartMessageAndPropagatesSmtpFailure() {
        var mail = mock(JavaMailSender.class);
        var messaging = mock(SimpMessagingTemplate.class);
        var sender = new NotificationDeliverySender(messaging, mail, "sender@example.invalid", clock);
        var delivery = sample(NotificationChannel.EMAIL);
        sender.send(delivery);
        var message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mail).send(message.capture());
        assertArrayEquals(new String[]{"account@example.invalid"}, message.getValue().getTo());
        assertEquals("sender@example.invalid", message.getValue().getFrom());
        assertTrue(message.getValue().getText().contains("07:15"));
        assertFalse(message.getValue().getText().contains("15 phút nữa"));
        assertTrue(message.getValue().getText().contains("A1"));
        doThrow(new MailSendException("SMTP unavailable")).when(mail).send(any(SimpleMailMessage.class));
        assertThrows(MailSendException.class, () -> sender.send(delivery));
        verifyNoInteractions(messaging);
    }

    @Test void websocketUsesPersonalQueueAndThePublicDtoAndPropagatesBrokerFailure() {
        var mail = mock(JavaMailSender.class);
        var messaging = mock(SimpMessagingTemplate.class);
        var sender = new NotificationDeliverySender(messaging, mail, "", clock);
        var delivery = sample(NotificationChannel.WEBSOCKET);
        sender.send(delivery);
        verify(messaging).convertAndSendToUser("student1", "/queue/notifications", delivery.notification());
        doThrow(new IllegalStateException("broker unavailable")).when(messaging)
                .convertAndSendToUser("student1", "/queue/notifications", delivery.notification());
        assertThrows(IllegalStateException.class, () -> sender.send(delivery));
        verifyNoInteractions(mail);
    }

    @Test void elapsedLeaseOrReminderDeadlinePreventsAnyTransportIo() {
        var mail = mock(JavaMailSender.class);
        var messaging = mock(SimpMessagingTemplate.class);
        var later = java.time.Clock.fixed(NOW.plusSeconds(900), java.time.ZoneOffset.UTC);
        var sender = new NotificationDeliverySender(messaging, mail, "", later);
        assertThrows(IllegalStateException.class, () -> sender.send(sample(NotificationChannel.EMAIL)));
        assertThrows(IllegalStateException.class, () -> sender.send(sample(NotificationChannel.WEBSOCKET)));
        verifyNoInteractions(mail, messaging);
    }

    @Test void reminderDeadlineIsCheckedEvenWhenTheLeaseIsStillValid() {
        var mail = mock(JavaMailSender.class);
        var messaging = mock(SimpMessagingTemplate.class);
        var sample = sample(NotificationChannel.EMAIL);
        var claim = new DeliveryClaim(sample.claim().id(), sample.claim().notificationId(), NotificationChannel.EMAIL,
                sample.claim().leaseToken(), 1, NOW.plusSeconds(120));
        var expiring = new PreparedDelivery(claim, sample.notification(), sample.username(), sample.email(), sample.fullName(), NOW.plusSeconds(30));
        var later = java.time.Clock.fixed(NOW.plusSeconds(30), java.time.ZoneOffset.UTC);
        assertThrows(IllegalStateException.class, () -> new NotificationDeliverySender(messaging, mail, "", later).send(expiring));
        verifyNoInteractions(mail, messaging);
    }

    private PreparedDelivery sample(NotificationChannel channel) {
        var id = UUID.randomUUID();
        var dto = new NotificationResponse(id, "CLASS_REMINDER", "Sắp đến giờ học: Toán",
                "Bạn có tiết học Toán lúc 07:15. Hãy chuẩn bị nhé!", "/student/timetable", false,
                Instant.parse("2026-10-21T00:00:00Z"), Map.of("room", "A1"));
        return new PreparedDelivery(new DeliveryClaim(UUID.randomUUID(), id, channel, UUID.randomUUID(), 1, NOW.plusSeconds(120)),
                dto, "student1", "account@example.invalid", "Nguyễn Văn An", NOW.plusSeconds(900));
    }
}
