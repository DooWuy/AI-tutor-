package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.dto.response.notification.NotificationResponse;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class NotificationCreationService {
    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {};
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final Clock learningClock;

    /** Joins the business transaction. PostgreSQL READ COMMITTED is required for conflict replays. */
    @Transactional
    public NotificationCreationResult create(NotificationCommand command) {
        Instant now = learningClock.instant();
        UUID id = UUID.randomUUID();
        String metadata = objectMapper.writeValueAsString(command.metadata());
        int inserted = jdbc.update("""
                INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at,
                    event_key, source_type, source_id, occurrence_at, metadata)
                VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?, ?, ?, CAST(? AS jsonb))
                ON CONFLICT (user_id, event_key) DO NOTHING
                """, id, command.userId(), command.title(), command.message(), command.type().name(),
                command.link(), Timestamp.from(now), command.eventKey(), command.sourceType().name(),
                command.sourceId(), timestamp(command.occurrenceAt()), metadata);

        if (inserted == 1) {
            for (var channel : command.channels()) {
                jdbc.update("""
                        INSERT INTO notification_deliveries (id, notification_id, channel, status,
                            attempt_count, next_attempt_at, expires_at, created_at, updated_at)
                        VALUES (?, ?, ?, 'PENDING', 0, ?, ?, ?, ?)
                        """, UUID.randomUUID(), id, channel.name(), Timestamp.from(now),
                        timestamp(command.expiresAt()), Timestamp.from(now), Timestamp.from(now));
            }
        }
        // A separate SELECT sees a concurrent winner after ON CONFLICT has waited for its commit.
        // Never use a uniqueness exception as flow control: PostgreSQL would abort the outer tx.
        NotificationResponse notification = jdbc.queryForObject("""
                SELECT id, type, title, message, link, is_read, created_at, metadata
                FROM notifications WHERE user_id = ? AND event_key = ?
                """, (rs, row) -> new NotificationResponse(rs.getObject("id", UUID.class),
                rs.getString("type"), rs.getString("title"), rs.getString("message"),
                rs.getString("link"), rs.getBoolean("is_read"), rs.getTimestamp("created_at").toInstant(),
                objectMapper.readValue(rs.getString("metadata"), METADATA_TYPE)),
                command.userId(), command.eventKey());
        return new NotificationCreationResult(notification, inserted == 1);
    }

    private static Timestamp timestamp(Instant value) {
        return value == null ? null : Timestamp.from(value);
    }
}
