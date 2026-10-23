package com.vn.aitutor.config;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.service.system.notification.ClassReminderService;
import com.vn.aitutor.service.system.notification.ReminderSlot;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ScheduleNotificationJobTest {
    @Test void scansBothSundayAndMondayWithoutTruncatingClock() {
        var reminders = mock(ClassReminderService.class);
        Instant now = Instant.parse("2026-10-25T16:55:12Z"); // Sunday 23:55:12
        var job = new ScheduleNotificationJob(reminders, Clock.fixed(now, ZoneOffset.UTC));
        when(reminders.findCandidates(any(), any(), any(), isNull(), eq(100))).thenReturn(List.of());
        job.scanAndSendNotifications();
        verify(reminders).findCandidates(LocalDate.of(2026, 10, 25), LocalTime.of(23, 55, 12), LocalTime.MAX, null, 100);
        verify(reminders).findCandidates(LocalDate.of(2026, 10, 26), LocalTime.MIN, LocalTime.of(0, 10, 12), null, 100);
    }

    @Test void oneSlotFailureDoesNotStopOtherRecipients() {
        var reminders = mock(ClassReminderService.class);
        Instant now = Instant.parse("2026-10-21T00:00:00Z");
        var one = new ReminderSlot(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 4, LocalTime.of(7, 10), "Toán", null);
        var two = new ReminderSlot(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 4, LocalTime.of(7, 15), "Văn", null);
        when(reminders.findCandidates(any(), any(), any(), isNull(), eq(100))).thenReturn(List.of(one, two));
        when(reminders.createIfEligible(eq(one), any(), any())).thenThrow(new IllegalStateException());
        new ScheduleNotificationJob(reminders, Clock.fixed(now, ZoneOffset.UTC)).scanAndSendNotifications();
        verify(reminders).createIfEligible(two, LocalDate.of(2026, 10, 21), now.plusSeconds(900));
    }
}
