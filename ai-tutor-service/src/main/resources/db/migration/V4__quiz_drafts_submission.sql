CREATE TABLE quiz_attempt_drafts (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id),
    student_id UUID NOT NULL REFERENCES students(id),
    started_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT ck_draft_time CHECK (expires_at > started_at)
);
CREATE UNIQUE INDEX uk_active_quiz_draft ON quiz_attempt_drafts(student_id, quiz_id) WHERE completed_at IS NULL;
CREATE INDEX idx_draft_expiry ON quiz_attempt_drafts(expires_at) WHERE completed_at IS NULL;
CREATE TABLE quiz_attempt_draft_answers (
    id UUID PRIMARY KEY,
    draft_id UUID NOT NULL REFERENCES quiz_attempt_drafts(id),
    question_id UUID NOT NULL REFERENCES quiz_questions(id),
    answer_value VARCHAR(200),
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_draft_question UNIQUE(draft_id, question_id)
);
ALTER TABLE quiz_attempts ADD COLUMN source_draft_id UUID REFERENCES quiz_attempt_drafts(id);
ALTER TABLE quiz_attempts ADD COLUMN correct_count INTEGER;
CREATE UNIQUE INDEX uk_attempt_source_draft ON quiz_attempts(source_draft_id);
-- Historical fixtures may already award XP more than once. Preserve them; constrain new submissions.
CREATE UNIQUE INDEX uk_quiz_first_reward ON quiz_attempts(student_id, quiz_id)
    WHERE xp_earned > 0 AND source_draft_id IS NOT NULL;
ALTER TABLE quiz_attempt_answers ALTER COLUMN selected_option_key TYPE VARCHAR(200);
ALTER TABLE quiz_questions ALTER COLUMN correct_option_key TYPE VARCHAR(200);
ALTER TABLE quizzes ADD COLUMN generation_status VARCHAR(16) NOT NULL DEFAULT 'READY';
UPDATE quizzes q SET generation_status = 'PROCESSING' WHERE is_ai_generated AND NOT EXISTS
    (SELECT 1 FROM quiz_questions qq WHERE qq.quiz_id = q.id);

CREATE FUNCTION reject_quiz_result_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.is_visible = TRUE AND NEW.is_visible = FALSE
       AND (to_jsonb(OLD) - 'is_visible') = (to_jsonb(NEW) - 'is_visible') THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'HISTORY_IMMUTABLE' USING ERRCODE = '42501';
END;
$$;
DROP TRIGGER trg_quiz_attempts_immutable ON quiz_attempts;
CREATE TRIGGER trg_quiz_attempts_immutable BEFORE UPDATE OR DELETE ON quiz_attempts
    FOR EACH ROW EXECUTE FUNCTION reject_quiz_result_mutation();
CREATE TRIGGER trg_quiz_answers_immutable BEFORE UPDATE OR DELETE ON quiz_attempt_answers
    FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
