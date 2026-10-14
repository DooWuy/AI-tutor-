-- =============================================================================
-- Consolidated V1 Database Schema Migration for AI Tutor
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Users & Authentication
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    phone_number VARCHAR(32),
    avatar_url VARCHAR(1024),
    gender VARCHAR(16) NOT NULL,
    role VARCHAR(16) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT ck_users_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT ck_users_role CHECK (role IN ('STUDENT', 'ADMIN', 'TEACHER'))
);

-- Default Admin Account (Password: Admin@123)
INSERT INTO users (
    id, username, email, password_hash, full_name, gender, role, is_active, is_deleted, created_at, updated_at
) VALUES (
    '3e9e5975-4fad-4226-8533-3ac9f573155d',
    'admin',
    'admin@aitutor.vn',
    '$2a$10$jzRIo3iVgYd2SZqmNMfdtOHuxbNPs8O3wLIIMujA/m4Oi8XoYs.iG',
    'Quản trị viên',
    'OTHER',
    'ADMIN',
    TRUE,
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

CREATE TABLE teachers (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    teacher_code VARCHAR(64) NOT NULL,
    department VARCHAR(255),
    subject_taught VARCHAR(255),
    school_name VARCHAR(255),
    CONSTRAINT uk_teachers_user_id UNIQUE (user_id),
    CONSTRAINT uk_teachers_teacher_code UNIQUE (teacher_code),
    CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE school_classes (
    id UUID PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    grade_level VARCHAR(32) NOT NULL,
    school_name VARCHAR(255),
    academic_year VARCHAR(16) NOT NULL,
    homeroom_teacher_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_school_classes_homeroom FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uk_school_classes_school_year_name
    ON school_classes (COALESCE(school_name, ''), academic_year, name);
CREATE INDEX idx_school_classes_homeroom ON school_classes (homeroom_teacher_id);

CREATE TABLE teacher_class_assignments (
    id UUID PRIMARY KEY,
    teacher_id UUID NOT NULL,
    class_id UUID NOT NULL,
    subject VARCHAR(64),
    is_homeroom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tca_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE,
    CONSTRAINT fk_tca_class FOREIGN KEY (class_id) REFERENCES school_classes (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uk_tca_teacher_class_subject
    ON teacher_class_assignments (teacher_id, class_id, COALESCE(subject, ''));
CREATE INDEX idx_tca_teacher_id ON teacher_class_assignments (teacher_id);
CREATE INDEX idx_tca_class_id ON teacher_class_assignments (class_id);

CREATE TABLE students (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    student_code VARCHAR(64) NOT NULL,
    class_id UUID,
    grade_level VARCHAR(32),
    class_name VARCHAR(64),
    school_name VARCHAR(255),
    email VARCHAR(255),
    address TEXT,
    parent_name VARCHAR(255),
    parent_email VARCHAR(255),
    parent_phone VARCHAR(32),
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    study_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uk_students_user_id UNIQUE (user_id),
    CONSTRAINT uk_students_student_code UNIQUE (student_code),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES school_classes (id) ON DELETE SET NULL
);

CREATE INDEX idx_students_class_id ON students (class_id);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_token_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 2. Curriculum & Learning Materials
-- -----------------------------------------------------------------------------
CREATE TABLE books (
    id UUID PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    subject VARCHAR(32) NOT NULL,
    grade_level VARCHAR(8) NOT NULL,
    curriculum_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_books_grade_level CHECK (grade_level IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'))
);

CREATE TABLE chapters (
    id UUID PRIMARY KEY,
    book_id UUID NOT NULL,
    chapter_code VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    display_order INTEGER NOT NULL,
    CONSTRAINT fk_chapters_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE RESTRICT,
    CONSTRAINT uk_chapters_book_code UNIQUE (book_id, chapter_code)
);

CREATE INDEX idx_chapters_book_order ON chapters (book_id, display_order);

CREATE TABLE lessons (
    id UUID PRIMARY KEY,
    chapter_id UUID NOT NULL,
    lesson_code VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    display_order INTEGER NOT NULL,
    CONSTRAINT fk_lessons_chapter FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE RESTRICT,
    CONSTRAINT uk_lessons_code UNIQUE (lesson_code)
);

CREATE INDEX idx_lessons_chapter_order ON lessons (chapter_id, display_order);

CREATE TABLE documents (
    id UUID PRIMARY KEY,
    lesson_id UUID,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(64),
    document_type VARCHAR(32),
    subject VARCHAR(64),
    grade_level VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSING',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_documents_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_documents_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE RESTRICT,
    CONSTRAINT ck_documents_status CHECK (status IN ('PROCESSING', 'SUCCESS', 'FAILED')),
    CONSTRAINT ck_documents_type CHECK (document_type IS NULL OR document_type IN ('THEORY', 'EXERCISE', 'EXAM'))
);

CREATE INDEX idx_documents_lesson_id ON documents (lesson_id);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_document_chunks_doc_idx UNIQUE (document_id, chunk_index),
    CONSTRAINT fk_document_chunks_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks (document_id);
CREATE INDEX idx_document_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- -----------------------------------------------------------------------------
-- 3. Adaptive Skills & Lesson-Skill Relations
-- -----------------------------------------------------------------------------
CREATE TABLE skills (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    description VARCHAR(1000),
    importance INTEGER NOT NULL DEFAULT 1,
    mastery_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.90,
    min_attempts INTEGER NOT NULL DEFAULT 3,
    can_skip BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT skills_code_key UNIQUE (code),
    CONSTRAINT ck_skills_importance CHECK (importance BETWEEN 1 AND 10),
    CONSTRAINT ck_skills_mastery_threshold CHECK (mastery_threshold >= 0.00 AND mastery_threshold <= 1.00),
    CONSTRAINT ck_skills_min_attempts CHECK (min_attempts BETWEEN 1 AND 100)
);

CREATE TABLE lesson_skills (
    id UUID PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_lesson_skills UNIQUE (lesson_id, skill_id)
);

CREATE INDEX idx_lesson_skills_lesson ON lesson_skills (lesson_id);
CREATE INDEX idx_lesson_skills_skill ON lesson_skills (skill_id);

-- -----------------------------------------------------------------------------
-- 4. Question Bank & AI Generation Jobs
-- -----------------------------------------------------------------------------
CREATE TABLE question_bank (
    id UUID PRIMARY KEY,
    lesson_id UUID NOT NULL,
    skill_id UUID REFERENCES skills (id) ON DELETE SET NULL,
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
    CONSTRAINT fk_question_bank_skill FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE SET NULL,
    CONSTRAINT ck_question_bank_difficulty CHECK (difficulty BETWEEN 1 AND 5),
    CONSTRAINT ck_question_bank_type CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MULTI_SELECT')),
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
    multi_select INTEGER,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT fk_ai_jobs_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_jobs_user FOREIGN KEY (requested_by_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_ai_jobs_kind CHECK (kind IN ('BANK', 'QUIZ')),
    CONSTRAINT ck_ai_jobs_status CHECK (status IN ('RUNNING', 'DONE', 'FAILED', 'ACKNOWLEDGED'))
);

CREATE UNIQUE INDEX uk_ai_jobs_bank_running
    ON ai_generation_jobs (requested_by_id, lesson_id)
    WHERE kind = 'BANK' AND status = 'RUNNING' AND lesson_id IS NOT NULL;
CREATE INDEX idx_ai_jobs_lesson_user ON ai_generation_jobs (lesson_id, requested_by_id, created_at DESC);
CREATE INDEX idx_ai_jobs_batch ON ai_generation_jobs (batch_id);

-- -----------------------------------------------------------------------------
-- 5. Quizzes & Assessments
-- -----------------------------------------------------------------------------
CREATE TABLE quizzes (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(64),
    grade_level VARCHAR(32),
    difficulty VARCHAR(16) NOT NULL,
    time_limit INTEGER NOT NULL DEFAULT 30,
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    max_attempts INTEGER NOT NULL DEFAULT 3,
    passing_score NUMERIC(5, 1) NOT NULL DEFAULT 70.0,
    lesson_id UUID,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    generation_status VARCHAR(16) NOT NULL DEFAULT 'READY',
    created_by_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_quizzes_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_quizzes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE RESTRICT,
    CONSTRAINT ck_quizzes_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    CONSTRAINT ck_quizzes_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT ck_quizzes_time_limit CHECK (time_limit BETWEEN 1 AND 180),
    CONSTRAINT ck_quizzes_max_attempts CHECK (max_attempts BETWEEN 1 AND 10),
    CONSTRAINT ck_quizzes_passing_score CHECK (passing_score >= 0 AND passing_score <= 100)
);

CREATE INDEX idx_quizzes_status ON quizzes (status);
CREATE INDEX idx_quizzes_created_by ON quizzes (created_by_id);
CREATE INDEX idx_quizzes_lesson ON quizzes (lesson_id);

-- Add foreign key constraint for ai_generation_jobs referencing quizzes
ALTER TABLE ai_generation_jobs
    ADD CONSTRAINT fk_ai_jobs_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE;
CREATE UNIQUE INDEX uk_ai_jobs_quiz_running
    ON ai_generation_jobs (requested_by_id, quiz_id)
    WHERE kind = 'QUIZ' AND status = 'RUNNING' AND quiz_id IS NOT NULL;
CREATE INDEX idx_ai_jobs_quiz_user ON ai_generation_jobs (quiz_id, requested_by_id, created_at DESC);

CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_option_key VARCHAR(200),
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 1,
    topic VARCHAR(255),
    question_type VARCHAR(32) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    difficulty INTEGER NOT NULL DEFAULT 3,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_text TEXT,
    source_question_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_questions_source FOREIGN KEY (source_question_id) REFERENCES question_bank (id) ON DELETE SET NULL,
    CONSTRAINT ck_quiz_questions_type CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MULTI_SELECT')),
    CONSTRAINT ck_quiz_questions_difficulty CHECK (difficulty BETWEEN 1 AND 5)
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions (quiz_id);
CREATE INDEX idx_quiz_questions_source ON quiz_questions (source_question_id);

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

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL,
    student_id UUID NOT NULL,
    source_draft_id UUID REFERENCES quiz_attempt_drafts(id),
    score DOUBLE PRECISION,
    correct_count INTEGER,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_at TIMESTAMPTZ,
    CONSTRAINT fk_quiz_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_quiz_attempts_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts (student_id);
CREATE INDEX idx_quiz_attempts_submitted_at ON quiz_attempts (submitted_at);
CREATE UNIQUE INDEX uk_attempt_source_draft ON quiz_attempts(source_draft_id);
CREATE UNIQUE INDEX uk_quiz_first_reward ON quiz_attempts(student_id, quiz_id)
    WHERE xp_earned > 0 AND source_draft_id IS NOT NULL;

CREATE TABLE quiz_attempt_answers (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL,
    question_id UUID NOT NULL,
    selected_option_key VARCHAR(200),
    is_correct BOOLEAN NOT NULL,
    CONSTRAINT fk_qaa_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts (id) ON DELETE CASCADE,
    CONSTRAINT fk_qaa_question FOREIGN KEY (question_id) REFERENCES quiz_questions (id) ON DELETE RESTRICT,
    CONSTRAINT uk_quiz_attempt_answers_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_quiz_attempt_answers_attempt_id ON quiz_attempt_answers (attempt_id);
CREATE INDEX idx_quiz_attempt_answers_question_id ON quiz_attempt_answers (question_id);

-- -----------------------------------------------------------------------------
-- 6. Communication, Calendar, Schedules & Notifications
-- -----------------------------------------------------------------------------
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    subject VARCHAR(64),
    title VARCHAR(255),
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    CONSTRAINT fk_chat_sessions_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT ck_chat_sessions_status CHECK (status IN ('OPEN', 'CLOSED'))
);

CREATE INDEX idx_chat_sessions_student_id ON chat_sessions (student_id);
CREATE INDEX idx_chat_sessions_student_last_msg ON chat_sessions (student_id, last_message_at);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    chat_session_id UUID NOT NULL,
    sender_type VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    audio_url VARCHAR(1024),
    intent VARCHAR(64),
    citation_links JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_chat_messages_session FOREIGN KEY (chat_session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE,
    CONSTRAINT ck_chat_messages_sender CHECK (sender_type IN ('STUDENT', 'AI'))
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages (chat_session_id);

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date_time TIMESTAMPTZ NOT NULL,
    end_date_time TIMESTAMPTZ,
    type VARCHAR(32) NOT NULL,
    location VARCHAR(255),
    has_reminder BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_minutes_before INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_calendar_events_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT ck_calendar_events_type CHECK (type IN ('EVENT', 'EXAM', 'QUIZ', 'ASSIGNMENT'))
);

CREATE INDEX idx_calendar_events_student_id ON calendar_events (student_id);
CREATE INDEX idx_calendar_events_start ON calendar_events (start_date_time);

CREATE TABLE schedules (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_schedules_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);

CREATE INDEX idx_schedules_student_id ON schedules (student_id);

CREATE TABLE schedule_slots (
    id UUID PRIMARY KEY,
    schedule_id UUID NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_name VARCHAR(255),
    room VARCHAR(100),
    schedule_type VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_slots_schedule FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE,
    CONSTRAINT ck_schedule_slots_day CHECK (day_of_week BETWEEN 2 AND 8)
);

CREATE INDEX idx_schedule_slots_schedule_id ON schedule_slots (schedule_id);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL,
    link VARCHAR(1024),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);

CREATE TABLE parent_alert_messages (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    class_id UUID NOT NULL,
    sender_user_id UUID NOT NULL,
    body VARCHAR(1000) NOT NULL,
    channel VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL,
    error_message VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pam_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_pam_class FOREIGN KEY (class_id) REFERENCES school_classes (id) ON DELETE CASCADE,
    CONSTRAINT fk_pam_sender FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_parent_alert_messages_student_id ON parent_alert_messages (student_id);
CREATE INDEX idx_parent_alert_messages_class_id ON parent_alert_messages (class_id);

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

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. System Settings & System Logs (Issue 10)
-- -----------------------------------------------------------------------------
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    group_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, group_name, description, updated_at)
VALUES
    ('gamification.daily_xp_cap', '500', 'GAMIFICATION', 'Hạn mức XP tối đa mỗi ngày cho học sinh', NOW()),
    ('ai.default_model', 'gemini-1.5-flash', 'AI_MODEL', 'Mô hình AI mặc định để tạo câu hỏi và chấm bài', NOW()),
    ('ai.temperature', '0.7', 'AI_MODEL', 'Nhiệt độ sáng tạo của mô hình AI (0.0 - 1.0)', NOW()),
    ('ai.api_key', '', 'AI_MODEL', 'Google Gemini / AI API Key tùy chỉnh', NOW()),
    ('system.maintenance_mode', 'false', 'MAINTENANCE', 'Chế độ bảo trì hệ thống toàn cục (true/false)', NOW()),
    ('system.maintenance_message', 'Hệ thống đang được nâng cấp bảo trì định kỳ. Vui lòng quay lại sau ít phút!', 'MAINTENANCE', 'Thông báo bảo trì hiển thị cho học sinh', NOW()),
    ('cache.redis_ttl_seconds', '3600', 'CACHE_DB', 'Thời gian lưu cache Redis mặc định (giây)', NOW())
ON CONFLICT (key) DO NOTHING;

CREATE TABLE system_logs (
    id UUID PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(255),
    stack_trace TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_logs_level ON system_logs (level);
CREATE INDEX idx_system_logs_created_at ON system_logs (created_at DESC);

-- -----------------------------------------------------------------------------
-- 8. History Immutability & Audit Triggers
-- -----------------------------------------------------------------------------
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

CREATE OR REPLACE FUNCTION reject_quiz_result_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF current_setting('app.allow_history_maintenance', true) = 'true' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.is_visible = TRUE AND NEW.is_visible = FALSE
        AND (to_jsonb(OLD) - 'is_visible') = (to_jsonb(NEW) - 'is_visible') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'HISTORY_IMMUTABLE' USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER trg_quiz_attempts_immutable
    BEFORE UPDATE OR DELETE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION reject_quiz_result_mutation();

CREATE TRIGGER trg_quiz_answers_immutable
    BEFORE UPDATE OR DELETE ON quiz_attempt_answers
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
