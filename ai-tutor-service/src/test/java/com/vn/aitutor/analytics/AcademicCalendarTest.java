package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.config.AcademicProperties;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.exception.ResourceBadRequestException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AcademicCalendarTest {

    private AcademicCalendar calendar;

    @BeforeEach
    void setUp() {
        calendar = new AcademicCalendar(new AcademicProperties());
    }

    @Test
    void academicYearStartsInAugust() {
        Instant september = Instant.parse("2026-09-21T00:00:00Z");
        assertEquals("2026-2027", calendar.currentAcademicYear(september));

        Instant january = Instant.parse("2026-01-10T00:00:00Z");
        assertEquals("2025-2026", calendar.currentAcademicYear(january));
    }

    @Test
    void last7DaysCoversTodayAndSixDaysBack() {
        Instant now = Instant.parse("2026-09-21T10:00:00+07:00");
        AcademicCalendar.DateRange range = calendar.resolve(ReportPeriod.LAST_7_DAYS, null, null, now);
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        assertEquals(LocalDate.of(2026, 9, 15), range.fromDate());
        assertEquals(LocalDate.of(2026, 9, 21), range.toDate());
        assertEquals(range.fromDate().atStartOfDay(zone).toInstant(), range.from());
    }

    @Test
    void customRequiresBothDates() {
        Instant now = Instant.parse("2026-09-21T00:00:00Z");
        assertThrows(
                ResourceBadRequestException.class,
                () -> calendar.resolve(ReportPeriod.CUSTOM, null, LocalDate.of(2026, 9, 21), now));
    }

    @Test
    void semester1UsesConfiguredBounds() {
        Instant now = Instant.parse("2026-09-21T00:00:00Z");
        AcademicCalendar.DateRange range = calendar.resolve(ReportPeriod.SEMESTER_1, null, null, now);
        assertEquals(LocalDate.of(2026, 8, 15), range.fromDate());
        assertEquals(LocalDate.of(2027, 1, 15), range.toDate());
    }

    @Test
    void countIsoDayOfWeekInAFullWeek() {
        LocalDate from = LocalDate.of(2026, 9, 14); // Monday
        LocalDate to = LocalDate.of(2026, 9, 20); // Sunday
        for (int dow = 1; dow <= 7; dow++) {
            assertEquals(1, AcademicCalendar.countIsoDayOfWeek(from, to, dow));
        }
        assertEquals(1.0, AcademicCalendar.weeksInPeriod(from, to));
        assertTrue(AcademicCalendar.weeksInPeriod(from, from.plusDays(6)) >= 1.0);
    }
}
