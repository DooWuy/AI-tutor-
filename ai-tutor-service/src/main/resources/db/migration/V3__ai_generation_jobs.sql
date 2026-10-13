CREATE TABLE ai_generation_jobs (
    id UUID PRIMARY KEY,
    kind VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL,
    lesson_id UUID,
    quiz_id UUID,
    batch_id UUID,
    requested_by_id UUID NOT NULL,
    difficulty INTEGER,
    question_count INTEGER,
    question_type VARCHAR(32),
    topic VARCHAR(200),
    min_difficulty INTEGER,
    max_difficulty INTEGER,
    multiple_choice INTEGER,
    true_false INTEGER,
    fill_blank INTEGER,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT fk_ai_jobs_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_jobs_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_jobs_user FOREIGN KEY (requested_by_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_ai_jobs_kind CHECK (kind IN ('BANK', 'QUIZ')),
    CONSTRAINT ck_ai_jobs_status CHECK (status IN ('RUNNING', 'DONE', 'FAILED', 'ACKNOWLEDGED'))
);

CREATE UNIQUE INDEX uk_ai_jobs_bank_running
    ON ai_generation_jobs (requested_by_id, lesson_id)
    WHERE kind = 'BANK' AND status = 'RUNNING' AND lesson_id IS NOT NULL;

CREATE UNIQUE INDEX uk_ai_jobs_quiz_running
    ON ai_generation_jobs (requested_by_id, quiz_id)
    WHERE kind = 'QUIZ' AND status = 'RUNNING' AND quiz_id IS NOT NULL;

CREATE INDEX idx_ai_jobs_lesson_user ON ai_generation_jobs (lesson_id, requested_by_id, created_at DESC);
CREATE INDEX idx_ai_jobs_quiz_user ON ai_generation_jobs (quiz_id, requested_by_id, created_at DESC);
CREATE INDEX idx_ai_jobs_batch ON ai_generation_jobs (batch_id);
