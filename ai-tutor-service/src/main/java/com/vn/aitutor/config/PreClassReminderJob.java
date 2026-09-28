package com.vn.aitutor.config;

import com.vn.aitutor.notification.NotificationClock;
import com.vn.aitutor.service.impl.StudyNotificationService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.notifications.pre-class-job", havingValue = "true")
public class PreClassReminderJob {

    private final StudyNotificationService studyNotificationService;

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Ho_Chi_Minh")
    public void remindBeforeClass() {
        int created = studyNotificationService.scan(LocalDateTime.now(NotificationClock.ZONE), null);
        if (created > 0) {
            log.info("Pre-class reminders created: {}", created);
        }
    }
}
