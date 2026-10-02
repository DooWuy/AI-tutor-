package com.vn.aitutor.job;

import com.vn.aitutor.entity.Notification;
import com.vn.aitutor.entity.ScheduleSlot;
import com.vn.aitutor.repository.NotificationRepository;
import com.vn.aitutor.repository.ScheduleSlotRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduleNotificationJob {

    private final ScheduleSlotRepository scheduleSlotRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    public void scanAndSendNotifications() {
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalTime now = LocalTime.now(vnZone).truncatedTo(ChronoUnit.MINUTES);
        LocalTime targetTime = now.plusMinutes(15);

        // Day of week: 1 (Monday) to 7 (Sunday) in java.time.
        // But our DB uses 2 to 8 (Monday to Sunday)
        int dayOfWeek = LocalDate.now(vnZone).getDayOfWeek().getValue() + 1;

        log.debug("Scanning for classes starting at {} on day {}", targetTime, dayOfWeek);

        List<ScheduleSlot> upcomingSlots = scheduleSlotRepository
                .findByDayOfWeekAndStartTimeAndSchedule_IsActiveTrue(dayOfWeek, targetTime);

        for (ScheduleSlot slot : upcomingSlots) {
            // Check student's study preferences to see if reminders are disabled
            Object isReminderEnabledObj = slot.getSchedule().getStudent().getStudyPreferences().get("studyReminderEnabled");
            if (isReminderEnabledObj != null && Boolean.FALSE.equals(isReminderEnabledObj)) {
                log.debug("Skipping reminder for {} because studyReminderEnabled is false", slot.getSchedule().getStudent().getUser().getUsername());
                continue;
            }

            String title = "Sắp đến giờ học: " + slot.getSubjectName();
            String message = "Bạn có tiết học " + slot.getSubjectName() + " lúc " + slot.getStartTime() + ". Hãy chuẩn bị nhé!";
            String link = "/student/chatbot?subject=" + slot.getSubjectName();

            Notification notification = new Notification();
            notification.setUser(slot.getSchedule().getStudent().getUser());
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType("CLASS_REMINDER");
            notification.setLink(link);
            notification.setRead(false);

            notificationRepository.save(notification);

            // Push to user via WebSocket
            messagingTemplate.convertAndSendToUser(
                    slot.getSchedule().getStudent().getUser().getUsername(),
                    "/queue/notifications",
                    notification
            );

            log.info("Sent reminder notification to {} for subject {}", notification.getUser().getUsername(), slot.getSubjectName());
        }
    }
}
