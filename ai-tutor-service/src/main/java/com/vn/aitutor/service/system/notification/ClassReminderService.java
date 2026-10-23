package com.vn.aitutor.service.system.notification;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClassReminderService {
    private final JdbcTemplate jdbc;
    private final NotificationCreationService notifications;
    private final Clock learningClock;
    private static final String ELIGIBLE_SLOTS = """
            SELECT slot.id, slot.schedule_id, student.user_id, slot.day_of_week,
                   slot.start_time, slot.subject_name, slot.room
            FROM schedule_slots slot
            JOIN schedules schedule ON schedule.id = slot.schedule_id
            JOIN students student ON student.id = schedule.student_id
            JOIN users account ON account.id = student.user_id
            WHERE schedule.is_active = TRUE AND account.is_active = TRUE AND account.is_deleted = FALSE
              AND NOT (student.study_preferences @> '{"studyReminderEnabled":false}'::jsonb)
            """;

    @Transactional(readOnly = true)
    public List<ReminderSlot> findCandidates(LocalDate date, LocalTime from, LocalTime until, UUID after, int batchSize) {
        String sql = ELIGIBLE_SLOTS + " AND slot.day_of_week = ? AND slot.start_time >= ? AND slot.start_time <= ?";
        var args = new java.util.ArrayList<Object>();
        args.add(date.getDayOfWeek().getValue() + 1);
        args.add(from);
        args.add(until);
        if (after != null) { sql += " AND slot.id > ?"; args.add(after); }
        args.add(batchSize);
        return jdbc.query(sql + " ORDER BY slot.id LIMIT ?", (rs, row) -> new ReminderSlot(
                rs.getObject("id", UUID.class), rs.getObject("schedule_id", UUID.class),
                rs.getObject("user_id", UUID.class), rs.getInt("day_of_week"),
                rs.getObject("start_time", LocalTime.class), rs.getString("subject_name"), rs.getString("room")), args.toArray());
    }

    @Transactional
    public boolean createIfEligible(ReminderSlot candidate, LocalDate date, Instant windowEnd) {
        Instant now = learningClock.instant();
        Instant startsAt = date.atTime(candidate.startTime()).atZone(NotificationCommands.REMINDER_ZONE).toInstant();
        if (!startsAt.isAfter(now) || startsAt.isAfter(windowEnd)) return false;
        // Re-read instead of relying on a projection from an earlier batch. SHARE locks serialize
        // preference/slot edits through commit; no database lock is held during external delivery.
        List<ReminderSlot> current = jdbc.query(ELIGIBLE_SLOTS + " AND slot.id = ? FOR SHARE OF slot, schedule, student, account",
                (rs, row) -> new ReminderSlot(rs.getObject("id", UUID.class), rs.getObject("schedule_id", UUID.class),
                        rs.getObject("user_id", UUID.class), rs.getInt("day_of_week"),
                        rs.getObject("start_time", LocalTime.class), rs.getString("subject_name"), rs.getString("room")), candidate.slotId());
        if (current.isEmpty()) return false;
        ReminderSlot slot = current.get(0);
        if (slot.dayOfWeek() != date.getDayOfWeek().getValue() + 1
                || !slot.startTime().equals(candidate.startTime()) || !slot.userId().equals(candidate.userId())) return false;
        if (!startsAt.isAfter(learningClock.instant())) return false;
        return notifications.create(NotificationCommands.classReminder(slot.userId(), slot.scheduleId(), slot.slotId(),
                slot.subject(), startsAt, slot.room())).created();
    }
}
