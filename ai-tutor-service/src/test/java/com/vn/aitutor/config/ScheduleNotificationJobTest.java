package com.vn.aitutor.config;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.vn.aitutor.entity.*;
import com.vn.aitutor.repository.NotificationRepository;
import com.vn.aitutor.repository.ScheduleSlotRepository;
import com.vn.aitutor.service.system.IMailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class ScheduleNotificationJobTest {

    @Mock
    private ScheduleSlotRepository scheduleSlotRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private IMailService mailService;

    private ScheduleNotificationJob job;

    @BeforeEach
    void setUp() {
        job = new ScheduleNotificationJob(
                scheduleSlotRepository,
                notificationRepository,
                messagingTemplate,
                mailService
        );
    }

    @Test
    void scanAndSendNotifications_whenUpcomingSlotsExist_savesNotificationSendsWsAndEmail() {
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalTime now = LocalTime.now(vnZone).truncatedTo(ChronoUnit.MINUTES);
        LocalTime targetTime = now.plusMinutes(15);
        int dayOfWeek = LocalDate.now(vnZone).getDayOfWeek().getValue() + 1;

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("student1");
        user.setEmail("student1@example.com");
        user.setFullName("Nguyễn Văn An");

        Student student = new Student();
        student.setUser(user);
        Map<String, Object> prefs = new HashMap<>();
        prefs.put("studyReminderEnabled", true);
        student.setStudyPreferences(prefs);

        Schedule schedule = new Schedule();
        schedule.setStudent(student);

        ScheduleSlot slot = new ScheduleSlot();
        slot.setSchedule(schedule);
        slot.setSubjectName("Toán");
        slot.setStartTime(targetTime);
        slot.setRoom("Phòng 202");

        when(scheduleSlotRepository.findByDayOfWeekAndStartTimeAndSchedule_IsActiveTrue(dayOfWeek, targetTime))
                .thenReturn(List.of(slot));

        job.scanAndSendNotifications();

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());
        Notification saved = notifCaptor.getValue();
        assertEquals("Sắp đến giờ học: Toán", saved.getTitle());
        assertEquals("CLASS_REMINDER", saved.getType());
        assertFalse(saved.isRead());

        verify(messagingTemplate).convertAndSendToUser(
                eq("student1"),
                eq("/queue/notifications"),
                any(Notification.class)
        );

        verify(mailService).sendClassReminderEmail(
                eq("student1@example.com"),
                eq("Nguyễn Văn An"),
                eq("Toán"),
                eq(targetTime.toString()),
                eq("Phòng 202")
        );
    }

    @Test
    void scanAndSendNotifications_whenReminderDisabled_skips() {
        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalTime now = LocalTime.now(vnZone).truncatedTo(ChronoUnit.MINUTES);
        LocalTime targetTime = now.plusMinutes(15);
        int dayOfWeek = LocalDate.now(vnZone).getDayOfWeek().getValue() + 1;

        User user = new User();
        user.setUsername("student2");

        Student student = new Student();
        student.setUser(user);
        Map<String, Object> prefs = new HashMap<>();
        prefs.put("studyReminderEnabled", false);
        student.setStudyPreferences(prefs);

        Schedule schedule = new Schedule();
        schedule.setStudent(student);

        ScheduleSlot slot = new ScheduleSlot();
        slot.setSchedule(schedule);
        slot.setSubjectName("Lý");

        when(scheduleSlotRepository.findByDayOfWeekAndStartTimeAndSchedule_IsActiveTrue(dayOfWeek, targetTime))
                .thenReturn(List.of(slot));

        job.scanAndSendNotifications();

        verify(notificationRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSendToUser(any(), any(), any());
        verify(mailService, never()).sendClassReminderEmail(any(), any(), any(), any(), any());
    }
}
