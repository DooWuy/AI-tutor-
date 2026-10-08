CREATE TABLE question_bank (
    id UUID PRIMARY KEY,
    lesson_id UUID NOT NULL,
    stem TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty INTEGER NOT NULL DEFAULT 3,
    question_type VARCHAR(32) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_text TEXT,
    review_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    batch_id UUID,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_question_bank_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE RESTRICT,
    CONSTRAINT fk_question_bank_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_question_bank_difficulty CHECK (difficulty BETWEEN 1 AND 5),
    CONSTRAINT ck_question_bank_type CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK')),
    CONSTRAINT ck_question_bank_status CHECK (review_status IN ('PENDING', 'ACTIVE')),
    CONSTRAINT ck_question_bank_stem_len CHECK (char_length(stem) BETWEEN 10 AND 2000),
    CONSTRAINT ck_question_bank_explanation_len CHECK (char_length(explanation) BETWEEN 10 AND 2000)
);

CREATE INDEX idx_question_bank_lesson_status ON question_bank (lesson_id, review_status);
CREATE INDEX idx_question_bank_batch ON question_bank (batch_id);

CREATE TABLE question_choices (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL,
    choice_key VARCHAR(8) NOT NULL,
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL,
    CONSTRAINT fk_question_choices_question FOREIGN KEY (question_id) REFERENCES question_bank (id) ON DELETE CASCADE,
    CONSTRAINT uk_question_choices_key UNIQUE (question_id, choice_key)
);

CREATE INDEX idx_question_choices_question ON question_choices (question_id);

UPDATE quizzes
SET time_limit = 30
WHERE time_limit IS NULL OR time_limit < 1 OR time_limit > 180;

ALTER TABLE quizzes
    ADD COLUMN status VARCHAR(16),
    ADD COLUMN max_attempts INTEGER,
    ADD COLUMN passing_score NUMERIC(5, 1),
    ADD COLUMN lesson_id UUID;

UPDATE quizzes
SET status = CASE WHEN is_active THEN 'PUBLISHED' ELSE 'DRAFT' END,
    max_attempts = 3,
    passing_score = 70.0;

ALTER TABLE quizzes
    ALTER COLUMN time_limit SET DEFAULT 30,
    ALTER COLUMN time_limit SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'DRAFT',
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN max_attempts SET DEFAULT 3,
    ALTER COLUMN max_attempts SET NOT NULL,
    ALTER COLUMN passing_score SET DEFAULT 70.0,
    ALTER COLUMN passing_score SET NOT NULL;

ALTER TABLE quizzes
    ADD CONSTRAINT ck_quizzes_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    ADD CONSTRAINT ck_quizzes_time_limit CHECK (time_limit BETWEEN 1 AND 180),
    ADD CONSTRAINT ck_quizzes_max_attempts CHECK (max_attempts BETWEEN 1 AND 10),
    ADD CONSTRAINT ck_quizzes_passing_score CHECK (passing_score >= 0 AND passing_score <= 100),
    ADD CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE RESTRICT;

CREATE INDEX idx_quizzes_status ON quizzes (status);
CREATE INDEX idx_quizzes_created_by ON quizzes (created_by_id);
CREATE INDEX idx_quizzes_lesson ON quizzes (lesson_id);

ALTER TABLE quiz_questions
    ADD COLUMN question_type VARCHAR(32) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN correct_text TEXT,
    ADD COLUMN source_question_id UUID,
    ADD CONSTRAINT ck_quiz_questions_type CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK')),
    ADD CONSTRAINT ck_quiz_questions_difficulty CHECK (difficulty BETWEEN 1 AND 5),
    ADD CONSTRAINT fk_quiz_questions_source FOREIGN KEY (source_question_id) REFERENCES question_bank (id) ON DELETE SET NULL;

CREATE INDEX idx_quiz_questions_source ON quiz_questions (source_question_id);
