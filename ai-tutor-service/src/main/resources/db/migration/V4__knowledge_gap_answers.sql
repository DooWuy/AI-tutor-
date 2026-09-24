ALTER TABLE quiz_questions
    ADD COLUMN topic VARCHAR(255);

CREATE TABLE quiz_attempt_answers (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL,
    question_id UUID NOT NULL,
    selected_option_key VARCHAR(64),
    is_correct BOOLEAN NOT NULL,
    CONSTRAINT fk_qaa_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts (id) ON DELETE CASCADE,
    CONSTRAINT fk_qaa_question FOREIGN KEY (question_id) REFERENCES quiz_questions (id) ON DELETE RESTRICT,
    CONSTRAINT uk_quiz_attempt_answers_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_quiz_attempt_answers_attempt_id ON quiz_attempt_answers (attempt_id);
CREATE INDEX idx_quiz_attempt_answers_question_id ON quiz_attempt_answers (question_id);
