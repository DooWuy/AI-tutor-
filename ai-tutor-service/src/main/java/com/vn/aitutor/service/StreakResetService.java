package com.vn.aitutor.service;

import java.sql.Timestamp;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StreakResetService {
    private final JdbcTemplate jdbc;

    /** One short transaction per batch; locked submissions are left for a later run. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int resetBatch(Instant yesterdayStart) {
        return jdbc.update("""
                WITH expired AS (
                    SELECT id FROM students
                    WHERE current_streak > 0
                      AND (last_activity_date < ? OR last_activity_date IS NULL)
                    ORDER BY last_activity_date NULLS FIRST, id
                    LIMIT 200 FOR UPDATE SKIP LOCKED
                )
                UPDATE students s SET current_streak = 0
                FROM expired e WHERE s.id = e.id
                """, Timestamp.from(yesterdayStart));
    }
}
