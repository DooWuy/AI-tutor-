package com.vn.aitutor.service.system;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.response.notification.NotificationResponse;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.service.system.notification.NotificationCursor;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.json.JsonMapper;

class NotificationServiceTest {
    @Test void cursorRoundTripsTimestampAndUuidWithoutLosingMicroseconds() {
        var dto = new NotificationResponse(UUID.randomUUID(), "QUIZ_GENERATED", "Title", "Message", null,
                false, Instant.parse("2026-10-21T00:00:00.123456Z"), Map.of());
        var cursor = NotificationCursor.decode(NotificationCursor.encode(dto));
        assertEquals(dto.id(), cursor.id());
        assertEquals(dto.createdAt(), cursor.createdAt());
    }

    @Test void malformedAndOutOfRangeCursorsAreBadRequests() {
        for (String value : new String[]{"", " ", "not-a-cursor", "x".repeat(300), "AAAA"}) {
            assertThrows(ResourceBadRequestException.class, () -> NotificationCursor.decode(value));
        }
        assertNull(NotificationCursor.decode(null));
        var jdbc = mock(JdbcTemplate.class);
        var service = new NotificationService(jdbc, JsonMapper.builder().build());
        assertThrows(ResourceBadRequestException.class, () -> service.getFeed(UUID.randomUUID(), null, 0, false));
        verifyNoInteractions(jdbc);
    }

    @Test void markReadAlwaysScopesUpdateByOwnerAndReturns404ForMissingOrForeignRows() {
        var jdbc = mock(JdbcTemplate.class);
        var service = new NotificationService(jdbc, JsonMapper.builder().build());
        UUID id = UUID.randomUUID(), user = UUID.randomUUID();
        String sql = "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?";
        when(jdbc.update(sql, id, user)).thenReturn(0, 1, 1);
        assertThrows(ResourceNotFoundException.class, () -> service.markAsRead(id, user));
        assertDoesNotThrow(() -> service.markAsRead(id, user));
        assertDoesNotThrow(() -> service.markAsRead(id, user));
        verify(jdbc, times(3)).update(sql, id, user);
    }
}
