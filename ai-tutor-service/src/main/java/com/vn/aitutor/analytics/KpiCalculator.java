package com.vn.aitutor.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

/**
 * Pure KPI arithmetic. No Spring / no persistence — unit-tested against AC-01.
 */
public final class KpiCalculator {

    public static final BigDecimal DEFAULT_SCORE_THRESHOLD = new BigDecimal("5.0");
    public static final int DEFAULT_INACTIVITY_DAYS = 7;
    public static final int CHAT_SESSION_CAP_SECONDS = 7200;

    private KpiCalculator() {
    }

    /**
     * Class quiz average = SUM(score) / COUNT(attempts). Never AVG(float) in SQL.
     * 640 / 80 must equal 8.0 exactly (AC-01).
     */
    public static BigDecimal averageScore(BigDecimal scoreSum, long attemptCount) {
        if (attemptCount <= 0 || scoreSum == null) {
            return null;
        }
        return scaleForDisplay(scoreSum.divide(BigDecimal.valueOf(attemptCount), 10, RoundingMode.HALF_UP));
    }

    public static BigDecimal averageScore(double scoreSum, long attemptCount) {
        if (attemptCount <= 0) {
            return null;
        }
        return averageScore(BigDecimal.valueOf(scoreSum), attemptCount);
    }

    public static BigDecimal averageStudyHoursPerWeek(long totalSeconds, int studentCount, double weeks) {
        if (studentCount <= 0 || weeks <= 0) {
            return null;
        }
        if (totalSeconds <= 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.UNNECESSARY);
        }
        BigDecimal hours = BigDecimal.valueOf(totalSeconds)
                .divide(BigDecimal.valueOf(3600L), 10, RoundingMode.HALF_UP);
        BigDecimal perStudent = hours.divide(BigDecimal.valueOf(studentCount), 10, RoundingMode.HALF_UP);
        return scaleForDisplay(perStudent.divide(BigDecimal.valueOf(weeks), 10, RoundingMode.HALF_UP));
    }

    public static BigDecimal weekdayAverageHours(long totalSeconds, int studentCount, long weekdayOccurrences) {
        if (studentCount <= 0 || weekdayOccurrences <= 0 || totalSeconds <= 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.UNNECESSARY);
        }
        BigDecimal hours = BigDecimal.valueOf(totalSeconds)
                .divide(BigDecimal.valueOf(3600L), 10, RoundingMode.HALF_UP);
        BigDecimal perStudent = hours.divide(BigDecimal.valueOf(studentCount), 10, RoundingMode.HALF_UP);
        return scaleForDisplay(perStudent.divide(BigDecimal.valueOf(weekdayOccurrences), 10, RoundingMode.HALF_UP));
    }

    public static Integer inactivityDays(Instant lastActivity, Instant now, ZoneId zone) {
        if (lastActivity == null) {
            return null;
        }
        LocalDate last = lastActivity.atZone(zone).toLocalDate();
        LocalDate today = now.atZone(zone).toLocalDate();
        return (int) ChronoUnit.DAYS.between(last, today);
    }

    /**
     * At-risk if average score &lt; 5.0 OR inactive more than 7 days (null last-activity counts as inactive).
     * Knowledge-gap criterion is deferred to a later slice.
     */
    public static boolean isAtRisk(BigDecimal studentAverageScore, Integer inactivityDays) {
        boolean lowScore = studentAverageScore != null
                && studentAverageScore.compareTo(DEFAULT_SCORE_THRESHOLD) < 0;
        boolean inactive = inactivityDays == null || inactivityDays > DEFAULT_INACTIVITY_DAYS;
        return lowScore || inactive;
    }

    public static boolean isHighRisk(BigDecimal studentAverageScore, Integer inactivityDays) {
        boolean lowScore = studentAverageScore != null
                && studentAverageScore.compareTo(DEFAULT_SCORE_THRESHOLD) < 0;
        boolean inactive = inactivityDays == null || inactivityDays > DEFAULT_INACTIVITY_DAYS;
        return lowScore && inactive;
    }

    public static long cappedOverlapSeconds(
            Instant createdAt,
            Instant lastMessageAt,
            Instant periodStart,
            Instant periodEnd) {
        if (createdAt == null || periodStart == null || periodEnd == null) {
            return 0L;
        }
        Instant end = lastMessageAt != null ? lastMessageAt : createdAt;
        Instant overlapStart = createdAt.isAfter(periodStart) ? createdAt : periodStart;
        Instant overlapEnd = end.isBefore(periodEnd) ? end : periodEnd;
        if (!overlapEnd.isAfter(overlapStart)) {
            return 0L;
        }
        long seconds = Duration.between(overlapStart, overlapEnd).getSeconds();
        if (seconds <= 0) {
            return 0L;
        }
        return Math.min(seconds, CHAT_SESSION_CAP_SECONDS);
    }

    static BigDecimal scaleForDisplay(BigDecimal value) {
        BigDecimal stripped = value.stripTrailingZeros();
        if (stripped.scale() < 1) {
            return stripped.setScale(1, RoundingMode.UNNECESSARY);
        }
        if (stripped.scale() > 4) {
            return stripped.setScale(4, RoundingMode.HALF_UP).stripTrailingZeros();
        }
        return stripped;
    }
}
