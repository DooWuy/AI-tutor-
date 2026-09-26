CREATE TABLE class_alert_settings (
    class_id UUID PRIMARY KEY,
    score_threshold NUMERIC(4, 1) NOT NULL,
    inactivity_days INTEGER NOT NULL,
    max_gap_topics INTEGER NOT NULL,
    message_template VARCHAR(2000) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT fk_alert_settings_class FOREIGN KEY (class_id) REFERENCES school_classes (id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_settings_user FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_alert_score CHECK (score_threshold > 0 AND score_threshold <= 10),
    CONSTRAINT ck_alert_inactive CHECK (inactivity_days >= 0 AND inactivity_days <= 365),
    CONSTRAINT ck_alert_gaps CHECK (max_gap_topics >= 1 AND max_gap_topics <= 50)
);

CREATE OR REPLACE FUNCTION reject_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_setting('app.allow_history_maintenance', true) IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'HISTORY_IMMUTABLE'
            USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_quiz_attempts_immutable
    BEFORE UPDATE OR DELETE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION reject_history_mutation();

CREATE TRIGGER trg_chat_messages_immutable
    BEFORE UPDATE OR DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION reject_history_mutation();

CREATE TRIGGER trg_parent_alert_messages_immutable
    BEFORE UPDATE OR DELETE ON parent_alert_messages
    FOR EACH ROW
    EXECUTE FUNCTION reject_history_mutation();
