package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.dto.response.notification.NotificationResponse;
import com.vn.aitutor.exception.ResourceBadRequestException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

public record NotificationCursor(Instant createdAt, UUID id) {
    public static String encode(NotificationResponse notification) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(
                (notification.createdAt() + "|" + notification.id()).getBytes(StandardCharsets.UTF_8));
    }

    public static NotificationCursor decode(String value) {
        if (value == null) return null;
        try {
            if (value.isBlank() || value.length() > 256) throw new IllegalArgumentException();
            String[] parts = new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8).split("\\|", -1);
            if (parts.length != 2 || parts[1].length() != 36) throw new IllegalArgumentException();
            Instant instant = Instant.parse(parts[0]);
            if (instant.isBefore(Instant.parse("0001-01-01T00:00:00Z"))
                    || instant.isAfter(Instant.parse("9999-12-31T23:59:59Z"))) throw new IllegalArgumentException();
            return new NotificationCursor(instant, UUID.fromString(parts[1]));
        } catch (RuntimeException invalid) {
            throw new ResourceBadRequestException("Cursor thông báo không hợp lệ");
        }
    }
}
