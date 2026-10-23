package com.vn.aitutor.config;

import com.vn.aitutor.entity.enums.NotificationChannel;
import com.vn.aitutor.service.system.notification.NotificationDeliverySender;
import com.vn.aitutor.service.system.notification.NotificationDeliveryStore;
import com.vn.aitutor.service.system.notification.NotificationDeliveryMetrics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@Slf4j
@ConditionalOnProperty(name = "app.notification.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationDeliveryJob {
    private static final int BATCH_SIZE = 100;
    private final NotificationDeliveryStore store;
    private final NotificationDeliverySender sender;
    private final NotificationDeliveryMetrics metrics;

    public NotificationDeliveryJob(NotificationDeliveryStore store, NotificationDeliverySender sender,
            NotificationDeliveryMetrics metrics) {
        this.store = store;
        this.sender = sender;
        this.metrics = metrics;
    }

    @Scheduled(fixedDelayString = "${app.notification.delivery-scan-ms:5000}", scheduler = "notificationTaskScheduler")
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void deliverPending() {
        try {
            store.reconcile(BATCH_SIZE);
            for (int i = 0; i < BATCH_SIZE; i++) {
                var next = store.claimNext();
                if (next.isEmpty()) break;
                var claim = next.get();
                try {
                    var prepared = store.prepare(claim);
                    if (prepared.isEmpty()) continue;
                    sender.send(prepared.get()); // Store transactions have committed before I/O starts.
                    if (store.sent(claim)) {
                        metrics.recordSent(claim.channel(), prepared.get().notification().createdAt());
                        log.debug("Notification delivery accepted: deliveryId={}, notificationId={}, channel={}",
                                claim.id(), claim.notificationId(), claim.channel());
                    }
                } catch (RuntimeException ex) {
                    String code = claim.channel() == NotificationChannel.EMAIL ? "EMAIL_SEND_FAILED" : "BROKER_SEND_FAILED";
                    try {
                        if (store.failed(claim, code) && claim.attemptCount() < NotificationDeliveryStore.MAX_ATTEMPTS) {
                            metrics.recordRetry(claim.channel());
                        }
                    } catch (RuntimeException recordFailure) {
                        // The existing lease makes a DB outage recoverable; do not drop the rest of the batch.
                        log.warn("Could not record outcome: deliveryId={}, notificationId={}, errorType={}",
                                claim.id(), claim.notificationId(), recordFailure.getClass().getSimpleName());
                    }
                    log.warn("Notification delivery failed: deliveryId={}, notificationId={}, errorCode={}, errorType={}",
                            claim.id(), claim.notificationId(), code, ex.getClass().getSimpleName());
                }
            }
        } finally {
            refreshMetrics();
        }
    }

    private void refreshMetrics() {
        try {
            metrics.refresh(store.metricsSnapshot());
        } catch (RuntimeException ex) {
            log.warn("Could not refresh notification delivery metrics ({})", ex.getClass().getSimpleName());
        }
    }
}
