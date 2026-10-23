package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.entity.enums.NotificationChannel;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

@Component
public class NotificationDeliveryMetrics {
    private final AtomicLong pending = new AtomicLong();
    private final AtomicLong failed = new AtomicLong();
    private final AtomicLong oldestPendingMillis = new AtomicLong();
    private final Map<NotificationChannel, Counter> retries = new EnumMap<>(NotificationChannel.class);
    private final Map<NotificationChannel, Timer> latency = new EnumMap<>(NotificationChannel.class);
    private final Clock clock;

    public NotificationDeliveryMetrics(MeterRegistry registry, Clock learningClock) {
        this.clock = learningClock;
        Gauge.builder("ai_tutor.notification.delivery.current", pending, AtomicLong::get)
                .tag("status", "pending")
                .description("Current notification deliveries waiting for their next attempt")
                .register(registry);
        Gauge.builder("ai_tutor.notification.delivery.current", failed, AtomicLong::get)
                .tag("status", "failed")
                .description("Current terminally failed notification deliveries")
                .register(registry);
        Gauge.builder("ai_tutor.notification.delivery.oldest_pending", oldestPendingMillis,
                        value -> value.get() / 1000.0)
                .baseUnit("seconds")
                .description("Age of the oldest pending or processing notification delivery")
                .register(registry);
        for (NotificationChannel channel : NotificationChannel.values()) {
            String tag = channel.name().toLowerCase(java.util.Locale.ROOT);
            retries.put(channel, Counter.builder("ai_tutor.notification.delivery.retries")
                    .tag("channel", tag)
                    .description("Notification delivery attempts scheduled for retry")
                    .register(registry));
            latency.put(channel, Timer.builder("ai_tutor.notification.delivery.latency")
                    .tag("channel", tag)
                    .description("Time from notification persistence until transport acceptance")
                    .publishPercentileHistogram()
                    .register(registry));
        }
    }

    public void refresh(DeliveryMetricsSnapshot snapshot) {
        pending.set(snapshot.pending());
        failed.set(snapshot.failed());
        oldestPendingMillis.set(Math.max(0L, Math.round(snapshot.oldestPendingSeconds() * 1000.0)));
    }

    public void recordRetry(NotificationChannel channel) {
        retries.get(channel).increment();
    }

    public void recordSent(NotificationChannel channel, Instant createdAt) {
        Duration elapsed = Duration.between(createdAt, clock.instant());
        latency.get(channel).record(Math.max(0L, elapsed.toMillis()), TimeUnit.MILLISECONDS);
    }
}
