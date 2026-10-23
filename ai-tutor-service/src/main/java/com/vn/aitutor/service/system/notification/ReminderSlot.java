package com.vn.aitutor.service.system.notification;

import java.time.LocalTime;
import java.util.UUID;

public record ReminderSlot(UUID slotId, UUID scheduleId, UUID userId, int dayOfWeek,
                           LocalTime startTime, String subject, String room) {}
