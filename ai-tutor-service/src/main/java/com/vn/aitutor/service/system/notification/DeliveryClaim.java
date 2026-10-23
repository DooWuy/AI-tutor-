package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.entity.enums.NotificationChannel;
import java.util.UUID;
import java.time.Instant;

public record DeliveryClaim(UUID id, UUID notificationId, NotificationChannel channel, UUID leaseToken,
                            int attemptCount, Instant leaseUntil) {}
