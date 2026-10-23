package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.entity.enums.NotificationChannel;
import java.time.Clock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/** Synchronous transport adapter: errors must reach the delivery worker. */
@Service
public class NotificationDeliverySender {
    private final SimpMessagingTemplate messaging;
    private final JavaMailSender mail;
    private final String from;
    private final Clock clock;

    public NotificationDeliverySender(SimpMessagingTemplate messaging, JavaMailSender mail,
            @Value("${spring.mail.username:}") String from, Clock learningClock) {
        this.messaging = messaging;
        this.mail = mail;
        this.from = from == null || from.isBlank() ? "noreply@aitutor.vn" : from.trim();
        this.clock = learningClock;
    }

    public void send(PreparedDelivery delivery) {
        // The process could pause between preparation and transport. Do not start I/O with
        // an expired lease or after the class starts, even if the snapshot was valid earlier.
        var now = clock.instant();
        if (!delivery.claim().leaseUntil().isAfter(now)
                || (delivery.expiresAt() != null && !delivery.expiresAt().isAfter(now))) {
            throw new IllegalStateException("Delivery deadline has passed");
        }
        if (delivery.claim().channel() == NotificationChannel.WEBSOCKET) {
            messaging.convertAndSendToUser(delivery.username(), "/queue/notifications", delivery.notification());
            return;
        }
        if (delivery.email() == null || delivery.email().isBlank()) throw new IllegalArgumentException("Missing recipient email");
        if (!"CLASS_REMINDER".equals(delivery.notification().type())) throw new IllegalArgumentException("Unsupported email notification type");
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(delivery.email().trim());
        message.setSubject("[AI Tutor] " + delivery.notification().title());
        String name = delivery.fullName() == null || delivery.fullName().isBlank() ? "bạn" : delivery.fullName();
        String room = (String) delivery.notification().metadata().get("room");
        message.setText("Xin chào " + name + ",\n\n" + delivery.notification().message()
                + (room == null || room.isBlank() ? "" : "\nPhòng học: " + room)
                + "\n\nChúc bạn học tốt!\nĐội ngũ AI Tutor");
        mail.send(message);
    }
}
