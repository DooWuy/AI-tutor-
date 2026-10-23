-- Existing notifications remain readable; only new business events carry a dedup key.
ALTER TABLE notifications
    ADD COLUMN event_key VARCHAR(255),
    ADD COLUMN source_type VARCHAR(32),
    ADD COLUMN source_id UUID,
    ADD COLUMN occurrence_at TIMESTAMPTZ,
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD CONSTRAINT uk_notifications_user_event UNIQUE (user_id, event_key),
    ADD CONSTRAINT ck_notifications_source_type CHECK (
        source_type IS NULL OR source_type IN ('SCHEDULE_SLOT', 'QUIZ', 'GENERATION_JOB')),
    ADD CONSTRAINT ck_notifications_source_pair CHECK ((source_type IS NULL) = (source_id IS NULL)),
    ADD CONSTRAINT ck_notifications_event_source CHECK (
        event_key IS NULL OR (btrim(event_key) <> '' AND source_type IS NOT NULL)),
    ADD CONSTRAINT ck_notifications_metadata CHECK (jsonb_typeof(metadata) = 'object');

CREATE INDEX idx_notifications_user_feed ON notifications (user_id, created_at DESC, id DESC);
CREATE INDEX idx_notifications_user_unread_feed ON notifications (user_id, created_at DESC, id DESC)
    WHERE is_read = FALSE;

CREATE TABLE notification_deliveries (
    id UUID PRIMARY KEY,
    notification_id UUID NOT NULL,
    channel VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lease_token UUID,
    lease_until TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_error_code VARCHAR(64),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notification_deliveries_notification FOREIGN KEY (notification_id)
        REFERENCES notifications (id) ON DELETE CASCADE,
    CONSTRAINT uk_notification_deliveries_channel UNIQUE (notification_id, channel),
    CONSTRAINT ck_notification_deliveries_channel CHECK (channel IN ('WEBSOCKET', 'EMAIL')),
    CONSTRAINT ck_notification_deliveries_status CHECK (
        status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT ck_notification_deliveries_attempt_count CHECK (attempt_count >= 0),
    CONSTRAINT ck_notification_deliveries_lease CHECK (
        (status = 'PROCESSING' AND lease_token IS NOT NULL AND lease_until IS NOT NULL)
        OR (status <> 'PROCESSING' AND lease_token IS NULL AND lease_until IS NULL)),
    CONSTRAINT ck_notification_deliveries_sent CHECK ((status = 'SENT') = (sent_at IS NOT NULL))
);

CREATE INDEX idx_notification_deliveries_pending ON notification_deliveries (next_attempt_at, id)
    WHERE status = 'PENDING';
CREATE INDEX idx_notification_deliveries_lease ON notification_deliveries (lease_until, id)
    WHERE status = 'PROCESSING';
