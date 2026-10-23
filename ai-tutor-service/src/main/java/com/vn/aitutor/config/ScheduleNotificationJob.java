package com.vn.aitutor.config;

import com.vn.aitutor.service.system.notification.ClassReminderService;
import com.vn.aitutor.service.system.notification.NotificationCommands;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.notification.enabled", havingValue = "true", matchIfMissing = true)
public class ScheduleNotificationJob {
    private static final int BATCH_SIZE = 100;
    private final ClassReminderService reminders;
    private final Clock learningClock;

    @Scheduled(fixedDelayString = "${app.notification.reminder-scan-ms:60000}", scheduler = "notificationTaskScheduler")
    public void scanAndSendNotifications() {
        var now = learningClock.instant();
        var end = now.plus(Duration.ofMinutes(15));
        var localNow = now.atZone(NotificationCommands.REMINDER_ZONE);
        var localEnd = end.atZone(NotificationCommands.REMINDER_ZONE);
        for (LocalDate date = localNow.toLocalDate(); !date.isAfter(localEnd.toLocalDate()); date = date.plusDays(1)) {
            LocalTime from = date.equals(localNow.toLocalDate()) ? localNow.toLocalTime() : LocalTime.MIN;
            LocalTime until = date.equals(localEnd.toLocalDate()) ? localEnd.toLocalTime() : LocalTime.MAX;
            UUID after = null;
            while (true) {
                var candidates = reminders.findCandidates(date, from, until, after, BATCH_SIZE);
                if (candidates.isEmpty()) break;
                for (var slot : candidates) {
                    try {
                        reminders.createIfEligible(slot, date, end);
                    } catch (RuntimeException ex) {
                        // One bad source must not stop other students; next scan retries eligible sources.
                        log.warn("Could not create reminder for slot {} ({})", slot.slotId(), ex.getClass().getSimpleName());
                    }
                }
                after = candidates.get(candidates.size() - 1).slotId();
                if (candidates.size() < BATCH_SIZE) break;
            }
        }
    }
}
