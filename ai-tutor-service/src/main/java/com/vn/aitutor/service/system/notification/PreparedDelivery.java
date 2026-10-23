package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.dto.response.notification.NotificationResponse;
import java.time.Instant;

public record PreparedDelivery(DeliveryClaim claim, NotificationResponse notification,
                               String username, String email, String fullName, Instant expiresAt) {}
