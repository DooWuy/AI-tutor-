package com.vn.aitutor.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReminderWindowTest {

    private final LocalDate monday = LocalDate.of(2026, 9, 1).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
    private final LocalDateTime lesson = monday.atTime(7, 0);

    @Test
    void exactMinuteIsOnlyTheLeadMinute() {
        assertTrue(ReminderWindow.isExactMinute(lesson.minusMinutes(15), lesson, 15));
        assertFalse(ReminderWindow.isExactMinute(lesson.minusMinutes(16), lesson, 15));
        assertFalse(ReminderWindow.isExactMinute(lesson.minusMinutes(14), lesson, 15));
    }

    @Test
    void catchUpCoversTheOpenLeadWindowAndStopsAtTheBell() {
        assertTrue(ReminderWindow.isCatchUp(lesson.minusMinutes(10), lesson, 15));
        assertTrue(ReminderWindow.isCatchUp(lesson.minusMinutes(15), lesson, 15));
        assertFalse(ReminderWindow.isCatchUp(lesson.minusMinutes(16), lesson, 15));
        assertFalse(ReminderWindow.isCatchUp(lesson, lesson, 15));
        assertFalse(ReminderWindow.isCatchUp(lesson.plusMinutes(1), lesson, 15));
    }

    @Test
    void midnightLessonIsDueTheEveningBefore() {
        LocalDateTime start = monday.plusDays(1).atTime(0, 10);
        LocalDateTime now = monday.atTime(23, 55);

        assertTrue(ReminderWindow.isExactMinute(now, start, 15));
        assertTrue(ReminderWindow.isCatchUp(now, start, 15));

        List<ReminderWindow.TimeRange> ranges = ReminderWindow.dueRanges(now, 15);
        assertEquals(2, ranges.size());
        assertEquals(monday, ranges.get(0).lessonDate());
        assertEquals(2, ranges.get(0).storedDayOfWeek());
        assertEquals(LocalTime.of(23, 55), ranges.get(0).afterExclusive());
        assertEquals(LocalTime.MAX, ranges.get(0).untilInclusive());
        assertEquals(monday.plusDays(1), ranges.get(1).lessonDate());
        assertEquals(3, ranges.get(1).storedDayOfWeek());
        assertNull(ranges.get(1).afterExclusive());
        assertEquals(LocalTime.of(0, 10), ranges.get(1).untilInclusive());
    }

    @Test
    void sameDayRangeEndsAtTheLeadDeadline() {
        LocalDateTime now = lesson.minusMinutes(15);
        List<ReminderWindow.TimeRange> ranges = ReminderWindow.dueRanges(now, 15);
        assertEquals(1, ranges.size());
        assertEquals(LocalTime.of(6, 45), ranges.get(0).afterExclusive());
        assertEquals(LocalTime.of(7, 0), ranges.get(0).untilInclusive());
        assertEquals(2, ranges.get(0).storedDayOfWeek());
    }
}
