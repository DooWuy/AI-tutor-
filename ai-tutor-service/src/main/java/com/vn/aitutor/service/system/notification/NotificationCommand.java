package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.entity.enums.NotificationChannel;
import com.vn.aitutor.entity.enums.NotificationSourceType;
import com.vn.aitutor.entity.enums.NotificationType;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/** Internal command built from trusted business data, never accepted from an HTTP client. */
public record NotificationCommand(
        UUID userId, NotificationType type, String eventKey,
        NotificationSourceType sourceType, UUID sourceId, Instant occurrenceAt,
        String title, String message, String link, Map<String, Object> metadata,
        Set<NotificationChannel> channels, Instant expiresAt) {

    public NotificationCommand {
        Objects.requireNonNull(userId, "userId");
        Objects.requireNonNull(type, "type");
        Objects.requireNonNull(sourceType, "sourceType");
        Objects.requireNonNull(sourceId, "sourceId");
        requireText(eventKey, 255, "eventKey");
        requireText(title, 255, "title");
        requireText(message, Integer.MAX_VALUE, "message");
        requireText(link, 1024, "link");
        if (!link.startsWith("/") || link.startsWith("//") || link.indexOf('\\') >= 0
                || link.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Notification link must be an internal application path");
        }
        metadata = Map.copyOf(Objects.requireNonNull(metadata, "metadata"));
        channels = Set.copyOf(Objects.requireNonNull(channels, "channels"));
        Set<NotificationChannel> expected = type == NotificationType.CLASS_REMINDER
                ? Set.of(NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL)
                : Set.of(NotificationChannel.WEBSOCKET);
        if (!channels.equals(expected)) {
            throw new IllegalArgumentException("Channels do not match the notification type");
        }
        if (type == NotificationType.CLASS_REMINDER) {
            Objects.requireNonNull(occurrenceAt, "occurrenceAt");
            if (sourceType != NotificationSourceType.SCHEDULE_SLOT || !occurrenceAt.equals(expiresAt)) {
                throw new IllegalArgumentException("Class reminders must expire at the slot occurrence");
            }
        } else if (sourceType == NotificationSourceType.SCHEDULE_SLOT || expiresAt != null) {
            throw new IllegalArgumentException("Quiz notifications require a quiz/job source and no expiry");
        }
    }

    private static void requireText(String value, int maxLength, String name) {
        if (value == null || value.isBlank() || value.length() > maxLength) {
            throw new IllegalArgumentException("Invalid notification " + name);
        }
    }
}
