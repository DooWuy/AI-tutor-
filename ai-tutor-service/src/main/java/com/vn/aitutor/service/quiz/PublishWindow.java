package com.vn.aitutor.service.quiz;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.time.Instant;

public final class PublishWindow {

    public static final String OPEN = "OPEN";
    public static final String UPCOMING = "UPCOMING";
    public static final String CLOSED = "CLOSED";

    private PublishWindow() {
    }

    public static String phase(Instant from, Instant until, Instant now) {
        if (from != null && now.isBefore(from)) {
            return UPCOMING;
        }
        if (until != null && !now.isBefore(until)) {
            return CLOSED;
        }
        return OPEN;
    }

    public static void requireOpen(Instant from, Instant until, Instant now) {
        String phase = phase(from, until, now);
        if (UPCOMING.equals(phase)) {
            throw new ResourceBadRequestException("Đề thi chưa đến giờ làm bài");
        }
        if (CLOSED.equals(phase)) {
            throw new ResourceBadRequestException("Đề thi đã hết thời gian làm bài");
        }
    }
}
