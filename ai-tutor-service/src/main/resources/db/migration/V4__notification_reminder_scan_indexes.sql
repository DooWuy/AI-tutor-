CREATE INDEX idx_schedule_slots_reminder_scan ON schedule_slots (day_of_week, start_time, id);
CREATE INDEX idx_notification_deliveries_expiry ON notification_deliveries (expires_at, id)
    WHERE status IN ('PENDING', 'PROCESSING') AND expires_at IS NOT NULL;
