package com.vn.aitutor.service.system.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.vn.aitutor.entity.enums.NotificationChannel;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class NotificationDeliveryMetricsTest {
    @Test
    void publishesCurrentStateRetryCountAndDeliveryLatencyWithBoundedTags() {
        var registry = new SimpleMeterRegistry();
        Instant now = Instant.parse("2026-10-23T01:00:00Z");
        var metrics = new NotificationDeliveryMetrics(registry, Clock.fixed(now, ZoneOffset.UTC));

        metrics.refresh(new DeliveryMetricsSnapshot(7, 2, 95.25));
        metrics.recordRetry(NotificationChannel.EMAIL);
        metrics.recordSent(NotificationChannel.WEBSOCKET, now.minusSeconds(8));

        assertEquals(7.0, registry.get("ai_tutor.notification.delivery.current")
                .tag("status", "pending").gauge().value());
        assertEquals(2.0, registry.get("ai_tutor.notification.delivery.current")
                .tag("status", "failed").gauge().value());
        assertEquals(95.25, registry.get("ai_tutor.notification.delivery.oldest_pending").gauge().value());
        assertEquals(1.0, registry.get("ai_tutor.notification.delivery.retries")
                .tag("channel", "email").counter().count());
        assertEquals(1, registry.get("ai_tutor.notification.delivery.latency")
                .tag("channel", "websocket").timer().count());
        assertEquals(8.0, registry.get("ai_tutor.notification.delivery.latency")
                .tag("channel", "websocket").timer().totalTime(java.util.concurrent.TimeUnit.SECONDS));
    }
}
