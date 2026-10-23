package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.entity.enums.NotificationChannel;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Service
@Transactional(propagation = Propagation.REQUIRES_NEW)
public class NotificationDeliveryStore {
    public static final int MAX_ATTEMPTS = 5;
    public static final Duration LEASE = Duration.ofSeconds(120);
    private static final long[] RETRY_SECONDS = {60, 300, 900, 3600};
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final Clock clock;

    public NotificationDeliveryStore(JdbcTemplate jdbc, ObjectMapper mapper, Clock learningClock) {
        this.jdbc = new NamedParameterJdbcTemplate(jdbc);
        this.mapper = mapper;
        this.clock = learningClock;
    }

    /** Finish invalid pending rows even when their next retry is still far in the future. */
    public int reconcile(int batchSize) {
        String sql = """
                WITH candidates AS (
                    SELECT d.id,
                        CASE WHEN d.expires_at <= :now THEN 'EXPIRED'
                             WHEN NOT u.is_active OR u.is_deleted THEN 'CANCELLED'
                             WHEN n.type = 'CLASS_REMINDER' AND NOT (%s) THEN 'CANCELLED'
                             ELSE 'FAILED' END AS terminal_status
                    FROM notification_deliveries d
                    JOIN notifications n ON n.id = d.notification_id
                    JOIN users u ON u.id = n.user_id
                    WHERE (d.status = 'PENDING' OR (d.status = 'PROCESSING' AND d.lease_until <= :now))
                      AND (d.expires_at <= :now OR NOT u.is_active OR u.is_deleted
                           OR (n.type = 'CLASS_REMINDER' AND NOT (%s)) OR d.attempt_count >= 5)
                    ORDER BY d.next_attempt_at, d.id FOR UPDATE OF d SKIP LOCKED LIMIT :batch
                )
                UPDATE notification_deliveries d SET status = c.terminal_status,
                    lease_token = NULL, lease_until = NULL, updated_at = :now,
                    last_error_code = CASE c.terminal_status WHEN 'EXPIRED' THEN 'DELIVERY_EXPIRED'
                        WHEN 'CANCELLED' THEN 'SOURCE_INELIGIBLE' ELSE 'ATTEMPTS_EXHAUSTED' END
                FROM candidates c WHERE d.id = c.id
                """.formatted(ReminderEligibility.VALID_SOURCE, ReminderEligibility.VALID_SOURCE);
        return jdbc.update(sql, Map.of("now", Timestamp.from(clock.instant()), "batch", batchSize));
    }

    public Optional<DeliveryClaim> claimNext() {
        Instant now = clock.instant();
        UUID token = UUID.randomUUID();
        var rows = jdbc.query("""
                WITH candidate AS (
                    SELECT id FROM notification_deliveries
                    WHERE ((status = 'PENDING' AND next_attempt_at <= :now)
                        OR (status = 'PROCESSING' AND lease_until <= :now)) AND attempt_count < 5
                    ORDER BY next_attempt_at, id FOR UPDATE SKIP LOCKED LIMIT 1
                )
                UPDATE notification_deliveries d SET status = 'PROCESSING', attempt_count = attempt_count + 1,
                    lease_token = :token, lease_until = :until, updated_at = :now
                FROM candidate c WHERE d.id = c.id
                RETURNING d.id, d.notification_id, d.channel, d.attempt_count, d.lease_until
                """, Map.of("now", Timestamp.from(now), "until", Timestamp.from(now.plus(LEASE)), "token", token),
                (rs, row) -> new DeliveryClaim(rs.getObject("id", UUID.class), rs.getObject("notification_id", UUID.class),
                        NotificationChannel.valueOf(rs.getString("channel")), token, rs.getInt("attempt_count"),
                        rs.getTimestamp("lease_until").toInstant()));
        return rows.stream().findFirst();
    }

    @Transactional(readOnly = true)
    public DeliveryMetricsSnapshot metricsSnapshot() {
        Instant now = clock.instant();
        return jdbc.queryForObject("""
                SELECT count(*) FILTER (WHERE status = 'PENDING') AS pending,
                       count(*) FILTER (WHERE status = 'FAILED') AS failed,
                       COALESCE(EXTRACT(EPOCH FROM (:now - min(created_at)
                           FILTER (WHERE status IN ('PENDING', 'PROCESSING')))), 0) AS oldest_pending_seconds
                FROM notification_deliveries
                """, Map.of("now", Timestamp.from(now)), (rs, row) -> new DeliveryMetricsSnapshot(
                        rs.getLong("pending"), rs.getLong("failed"), rs.getDouble("oldest_pending_seconds")));
    }

    /** Snapshot current recipient/source immediately before external I/O; never returns a JPA proxy. */
    public Optional<PreparedDelivery> prepare(DeliveryClaim claim) {
        Instant now = clock.instant();
        var rows = jdbc.query("""
                SELECT n.*, u.username, u.email, u.full_name, u.is_active, u.is_deleted, d.expires_at,
                       (n.type <> 'CLASS_REMINDER' OR (%s)) AS valid_source
                FROM notification_deliveries d JOIN notifications n ON n.id = d.notification_id
                JOIN users u ON u.id = n.user_id
                WHERE d.id = :id AND d.status = 'PROCESSING' AND d.lease_token = :token AND d.lease_until > :now
                """.formatted(ReminderEligibility.VALID_SOURCE), ownership(claim, now), (rs, row) -> {
            Timestamp expires = rs.getTimestamp("expires_at");
            String terminal = expires != null && !expires.toInstant().isAfter(now) ? "EXPIRED"
                    : !rs.getBoolean("is_active") || rs.getBoolean("is_deleted") || !rs.getBoolean("valid_source") ? "CANCELLED" : null;
            return new Preparation(new PreparedDelivery(claim, NotificationRows.read(rs, mapper),
                    rs.getString("username"), rs.getString("email"), rs.getString("full_name"),
                    expires == null ? null : expires.toInstant()), terminal);
        });
        if (rows.isEmpty()) return Optional.empty();
        Preparation prepared = rows.get(0);
        if (prepared.terminal() != null) {
            finish(claim, prepared.terminal(), prepared.terminal().equals("EXPIRED") ? "DELIVERY_EXPIRED" : "SOURCE_INELIGIBLE", now);
            return Optional.empty();
        }
        return Optional.of(prepared.delivery());
    }

    public boolean sent(DeliveryClaim claim) {
        return finish(claim, "SENT", null, clock.instant()) == 1;
    }

    public boolean failed(DeliveryClaim claim, String errorCode) {
        Instant now = clock.instant();
        long delay = RETRY_SECONDS[Math.min(Math.max(claim.attemptCount() - 1, 0), RETRY_SECONDS.length - 1)];
        var params = new java.util.HashMap<>(ownership(claim, now));
        params.put("next", Timestamp.from(now.plusSeconds(delay)));
        params.put("error", errorCode);
        params.put("max", MAX_ATTEMPTS);
        return jdbc.update("""
                UPDATE notification_deliveries SET
                    status = CASE WHEN expires_at <= :now THEN 'EXPIRED'
                        WHEN attempt_count >= :max THEN 'FAILED' ELSE 'PENDING' END,
                    next_attempt_at = :next, lease_token = NULL, lease_until = NULL, updated_at = :now,
                    last_error_code = CASE WHEN expires_at <= :now THEN 'DELIVERY_EXPIRED' ELSE :error END
                WHERE id = :id AND status = 'PROCESSING' AND lease_token = :token AND lease_until > :now
                """, params) == 1;
    }

    private int finish(DeliveryClaim claim, String status, String error, Instant now) {
        var params = new java.util.HashMap<>(ownership(claim, now));
        params.put("status", status);
        params.put("error", error);
        params.put("sent", status.equals("SENT") ? Timestamp.from(now) : null);
        return jdbc.update("""
                UPDATE notification_deliveries SET status = :status, lease_token = NULL, lease_until = NULL,
                    last_error_code = :error, sent_at = :sent, updated_at = :now
                WHERE id = :id AND status = 'PROCESSING' AND lease_token = :token AND lease_until > :now
                """, params);
    }

    private Map<String, Object> ownership(DeliveryClaim claim, Instant now) {
        return Map.of("id", claim.id(), "token", claim.leaseToken(), "now", Timestamp.from(now));
    }

    private record Preparation(PreparedDelivery delivery, String terminal) {}
}
