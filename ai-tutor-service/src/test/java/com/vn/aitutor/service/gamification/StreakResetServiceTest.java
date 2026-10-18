package com.vn.aitutor.service.gamification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.Instant;

@ExtendWith(MockitoExtension.class)
class StreakResetServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private StreakResetService streakResetService;

    @Test
    void resetBatch_callsJdbcUpdateWithTimestamp() {
        Instant yesterday = Instant.now();
        when(jdbcTemplate.update(anyString(), any(Timestamp.class))).thenReturn(5);

        int updated = streakResetService.resetBatch(yesterday);

        assertEquals(5, updated);
        verify(jdbcTemplate).update(contains("UPDATE students"), eq(Timestamp.from(yesterday)));
    }
}
