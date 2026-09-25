package com.vn.aitutor.analytics;

import com.vn.aitutor.config.AcademicProperties;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.exception.ResourceBadRequestException;
import java.time.DateTimeException;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.MonthDay;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AcademicCalendar {

    private static final DateTimeFormatter MONTH_DAY = DateTimeFormatter.ofPattern("MM-dd");

    private final AcademicProperties properties;

    public ZoneId zoneId() {
        try {
            return ZoneId.of(properties.getTimezone());
        } catch (DateTimeException ex) {
            return ZoneId.of("Asia/Ho_Chi_Minh");
        }
    }

    public String currentAcademicYear(Instant now) {
        ZonedDateTime zoned = now.atZone(zoneId());
        int year = zoned.getYear();
        int month = zoned.getMonthValue();
        if (month < 8) {
            return (year - 1) + "-" + year;
        }
        return year + "-" + (year + 1);
    }

    public DateRange resolve(ReportPeriod period, LocalDate from, LocalDate to, Instant now) {
        ZoneId zone = zoneId();
        ZonedDateTime zonedNow = now.atZone(zone);
        LocalDate today = zonedNow.toLocalDate();

        return switch (period) {
            case LAST_7_DAYS -> rangeForDates(today.minusDays(6), today, zone);
            case LAST_30_DAYS -> rangeForDates(today.minusDays(29), today, zone);
            case SEMESTER_1 -> semester1Range(now, zone);
            case CUSTOM -> customRange(from, to, zone);
        };
    }

    public static LocalDate mondayOf(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    public static long countIsoDayOfWeek(LocalDate from, LocalDate to, int isoDayOfWeek) {
        if (to.isBefore(from)) {
            return 0;
        }
        long count = 0;
        for (LocalDate cursor = from; !cursor.isAfter(to); cursor = cursor.plusDays(1)) {
            if (cursor.getDayOfWeek().getValue() == isoDayOfWeek) {
                count++;
            }
        }
        return count;
    }

    public static double weeksInPeriod(LocalDate from, LocalDate to) {
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        if (days <= 0) {
            return 1.0;
        }
        return Math.max(1.0, days / 7.0);
    }

    private DateRange semester1Range(Instant now, ZoneId zone) {
        String academicYear = currentAcademicYear(now);
        String[] parts = academicYear.split("-");
        int startYear = Integer.parseInt(parts[0]);
        MonthDay startMd = parseMonthDay(properties.getSemester1().getStartMonthDay(), 8, 15);
        MonthDay endMd = parseMonthDay(properties.getSemester1().getEndMonthDay(), 1, 15);
        LocalDate start = startMd.atYear(startYear);
        int endYear = endMd.getMonthValue() < startMd.getMonthValue() ? startYear + 1 : startYear;
        LocalDate end = endMd.atYear(endYear);
        return rangeForDates(start, end, zone);
    }

    private DateRange customRange(LocalDate from, LocalDate to, ZoneId zone) {
        if (from == null || to == null) {
            throw new ResourceBadRequestException("Khoảng thời gian tùy chọn cần đủ ngày bắt đầu và ngày kết thúc");
        }
        if (from.isAfter(to)) {
            throw new ResourceBadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
        }
        return rangeForDates(from, to, zone);
    }

    private DateRange rangeForDates(LocalDate fromDate, LocalDate toDate, ZoneId zone) {
        Instant from = fromDate.atStartOfDay(zone).toInstant();
        Instant to = toDate.atTime(LocalTime.MAX).atZone(zone).toInstant();
        return new DateRange(from, to, fromDate, toDate);
    }

    private MonthDay parseMonthDay(String raw, int defaultMonth, int defaultDay) {
        if (raw == null || raw.isBlank()) {
            return MonthDay.of(defaultMonth, defaultDay);
        }
        try {
            return MonthDay.parse(raw.trim(), MONTH_DAY);
        } catch (DateTimeException ex) {
            return MonthDay.of(defaultMonth, defaultDay);
        }
    }

    public record DateRange(Instant from, Instant to, LocalDate fromDate, LocalDate toDate) {
        public int startYear() {
            return fromDate.getYear();
        }
    }
}
