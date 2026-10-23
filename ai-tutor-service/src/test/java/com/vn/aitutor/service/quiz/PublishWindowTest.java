package com.vn.aitutor.service.quiz;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class PublishWindowTest {

    private final Instant now = Instant.parse("2026-10-19T03:00:00Z");

    @Test
    void missingBoundsStayOpen() {
        assertEquals(PublishWindow.OPEN, PublishWindow.phase(null, null, now));
    }

    @Test
    void beforeStartIsUpcoming() {
        assertEquals(PublishWindow.UPCOMING, PublishWindow.phase(now.plusSeconds(60), now.plusSeconds(3600), now));
        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class,
                () -> PublishWindow.requireOpen(now.plusSeconds(60), null, now));
        assertEquals("Đề thi chưa đến giờ làm bài", error.getMessage());
    }

    @Test
    void atEndIsClosed() {
        assertEquals(PublishWindow.CLOSED, PublishWindow.phase(now.minusSeconds(60), now, now));
        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class,
                () -> PublishWindow.requireOpen(null, now, now));
        assertEquals("Đề thi đã hết thời gian làm bài", error.getMessage());
    }

    @Test
    void insideWindowIsOpen() {
        assertEquals(PublishWindow.OPEN, PublishWindow.phase(now.minusSeconds(60), now.plusSeconds(60), now));
    }
}
