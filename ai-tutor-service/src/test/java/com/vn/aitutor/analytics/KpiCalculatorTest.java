package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;

class KpiCalculatorTest {

    @Test
    void ac01_classAverageIsExactlyEightPointZero() {
        BigDecimal average = KpiCalculator.averageScore(new BigDecimal("640"), 80);
        assertEquals(0, average.compareTo(new BigDecimal("8.0")));
        assertEquals("8.0", average.toPlainString());
    }

    @Test
    void ac01_doubleSumDoesNotDrift() {
        BigDecimal average = KpiCalculator.averageScore(640.0d, 80);
        assertEquals(0, average.compareTo(new BigDecimal("8.0")));
        assertEquals("8.0", average.toPlainString());
    }

    @Test
    void averageScoreIsNullWhenNoAttempts() {
        assertNull(KpiCalculator.averageScore(BigDecimal.ZERO, 0));
        assertNull(KpiCalculator.averageScore(0d, 0));
    }

    @Test
    void atRisk_highWhenLowScoreAndInactiveEightDays() {
        BigDecimal avg = new BigDecimal("4.5");
        assertTrue(KpiCalculator.isAtRisk(avg, 8));
        assertTrue(KpiCalculator.isHighRisk(avg, 8));
    }

    @Test
    void atRisk_notFlaggedWhenScoreSixAndActive() {
        assertFalse(KpiCalculator.isAtRisk(new BigDecimal("6.0"), 2));
        assertFalse(KpiCalculator.isHighRisk(new BigDecimal("6.0"), 2));
    }

    @Test
    void atRisk_inactiveOnlyStillCounted() {
        assertTrue(KpiCalculator.isAtRisk(new BigDecimal("8.0"), 8));
        assertFalse(KpiCalculator.isHighRisk(new BigDecimal("8.0"), 8));
    }

    @Test
    void atRisk_nullLastActivityCountsAsInactive() {
        assertTrue(KpiCalculator.isAtRisk(new BigDecimal("8.0"), null));
    }

    @Test
    void inactivityDays_usesCalendarDates() {
        Instant now = Instant.parse("2026-09-21T10:00:00Z");
        Instant eightDaysAgo = now.minus(8, ChronoUnit.DAYS);
        Integer days = KpiCalculator.inactivityDays(eightDaysAgo, now, ZoneId.of("Asia/Ho_Chi_Minh"));
        assertEquals(8, days);
    }

    @Test
    void studyHoursPerWeek_dividesByStudentsAndWeeks() {
        // 40 students * 2 attempts * 1800s = 144000s = 40h; 40 students; 1 week → 1.0
        BigDecimal hours = KpiCalculator.averageStudyHoursPerWeek(144_000L, 40, 1.0);
        assertEquals(0, hours.compareTo(new BigDecimal("1.0")));
    }
}
