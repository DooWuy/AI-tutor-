package com.vn.aitutor.notification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public final class ReminderWindow {

    private ReminderWindow() {
    }

    /**
     * @param afterExclusive null means the range starts at the beginning of {@code lessonDate}
     */
    public record TimeRange(
            LocalDate lessonDate,
            int storedDayOfWeek,
            LocalTime afterExclusive,
            LocalTime untilInclusive
    ) {
    }

    public static boolean isExactMinute(LocalDateTime now, LocalDateTime lessonStart, int leadMinutes) {
        LocalDateTime from = now.plusMinutes(leadMinutes).withSecond(0).withNano(0);
        LocalDateTime to = from.plusMinutes(1);
        return !lessonStart.isBefore(from) && lessonStart.isBefore(to);
    }

    public static boolean isCatchUp(LocalDateTime now, LocalDateTime lessonStart, int leadMinutes) {
        LocalDateTime deadline = now.plusMinutes(leadMinutes);
        return lessonStart.isAfter(now) && !lessonStart.isAfter(deadline);
    }

    public static List<TimeRange> dueRanges(LocalDateTime now, int leadMinutes) {
        LocalDateTime deadline = now.plusMinutes(leadMinutes);
        if (deadline.toLocalDate().equals(now.toLocalDate())) {
            return List.of(range(now.toLocalDate(), now.toLocalTime(), deadline.toLocalTime()));
        }
        return List.of(
                range(now.toLocalDate(), now.toLocalTime(), LocalTime.MAX),
                range(deadline.toLocalDate(), null, deadline.toLocalTime())
        );
    }

    private static TimeRange range(LocalDate lessonDate, LocalTime afterExclusive, LocalTime untilInclusive) {
        return new TimeRange(lessonDate, StoredDayOfWeek.from(lessonDate.getDayOfWeek()), afterExclusive, untilInclusive);
    }
}
