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

CREATE TABLE students (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    student_code VARCHAR(64) NOT NULL,
    grade_level VARCHAR(32),
    class_name VARCHAR(64),
    school_name VARCHAR(255),
    email VARCHAR(255),
    address TEXT,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    study_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uk_students_user_id UNIQUE (user_id),
    CONSTRAINT uk_students_student_code UNIQUE (student_code),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

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

CREATE TABLE quizzes (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(64),
    grade_level VARCHAR(32),
    difficulty VARCHAR(16) NOT NULL,
    time_limit INTEGER,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_quizzes_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_quizzes_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'))
);

CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_option_key VARCHAR(64),
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_quiz_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions (quiz_id);

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL,
    student_id UUID NOT NULL,
    score DOUBLE PRECISION,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    submitted_at TIMESTAMPTZ,
    CONSTRAINT fk_quiz_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_quiz_attempts_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts (student_id);

CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(64),
    subject VARCHAR(64),
    grade_level VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'PROCESSING',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_documents_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT ck_documents_status CHECK (status IN ('PROCESSING', 'SUCCESS', 'FAILED'))
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_document_chunks_doc_idx UNIQUE (document_id, chunk_index),
    CONSTRAINT fk_document_chunks_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks (document_id);

CREATE INDEX idx_document_chunks_embedding_hnsw
    ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Insert default admin account
INSERT INTO users (
    id, 
    username, 
    email, 
    password_hash, 
    full_name, 
    gender, 
    role, 
    is_active, 
    is_deleted, 
    created_at, 
    updated_at
) VALUES (
    '3e9e5975-4fad-4226-8533-3ac9f573155d',
    'admin',
    'admin@aitutor.vn',
    '$2a$10$jzRIo3iVgYd2SZqmNMfdtOHuxbNPs8O3wLIIMujA/m4Oi8XoYs.iG', -- Hash cho mật khẩu Admin@123
    'Quản trị viên',
    'OTHER',
    'ADMIN',
    TRUE,
    FALSE,
    NOW(),
    NOW()
);

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

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_token_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE

);

CREATE TABLE school_classes (
    id UUID PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    grade_level VARCHAR(32) NOT NULL,
    school_name VARCHAR(255),
    academic_year VARCHAR(16) NOT NULL,
    homeroom_teacher_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_school_classes_homeroom
        FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
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

ALTER TABLE students ADD COLUMN class_id UUID;

ALTER TABLE students
    ADD CONSTRAINT fk_students_class
    FOREIGN KEY (class_id) REFERENCES school_classes (id) ON DELETE SET NULL;

CREATE INDEX idx_students_class_id ON students (class_id);

INSERT INTO school_classes (id, name, grade_level, school_name, academic_year, created_at)
SELECT gen_random_uuid(),
       btrim(s.class_name),
       COALESCE(MAX(s.grade_level), ''),
       s.school_name,
       CASE
           WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 8
               THEN (EXTRACT(YEAR FROM CURRENT_DATE)::int - 1)::text
                    || '-'
                    || EXTRACT(YEAR FROM CURRENT_DATE)::int::text
           ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int::text
                    || '-'
                    || (EXTRACT(YEAR FROM CURRENT_DATE)::int + 1)::text
       END,
       NOW()
FROM students s
WHERE s.class_name IS NOT NULL
  AND btrim(s.class_name) <> ''
GROUP BY btrim(s.class_name), s.school_name;

UPDATE students st
SET class_id = sc.id
FROM school_classes sc
WHERE st.class_name IS NOT NULL
  AND btrim(st.class_name) = sc.name
  AND COALESCE(st.school_name, '') = COALESCE(sc.school_name, '');

CREATE INDEX idx_quiz_attempts_submitted_at ON quiz_attempts (submitted_at);
CREATE INDEX idx_chat_sessions_student_last_msg ON chat_sessions (student_id, last_message_at);

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
