-- No historical balances/streaks are rewritten. Reads apply effective streak semantics.
CREATE INDEX idx_quiz_attempts_student_submitted
    ON quiz_attempts(student_id, submitted_at DESC, id DESC);

CREATE INDEX idx_students_streak_reset
    ON students(last_activity_date, id) WHERE current_streak > 0;
