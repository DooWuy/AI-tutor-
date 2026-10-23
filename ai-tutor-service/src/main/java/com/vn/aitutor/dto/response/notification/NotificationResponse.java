package com.vn.aitutor.dto.response.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.vn.aitutor.entity.Notification;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Public REST/STOMP payload. Persistence and delivery fields never leave the server. */
public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String message,
        String link,
        @JsonProperty("isRead") boolean isRead,
        Instant createdAt,
        Map<String, Object> metadata) {

    public NotificationResponse {
        metadata = metadata == null ? Map.of() : Map.copyOf(metadata);
    }

    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getType(),
                notification.getTitle(), notification.getMessage(), notification.getLink(),
                notification.isRead(), notification.getCreatedAt(), notification.getMetadata());
    }
}
