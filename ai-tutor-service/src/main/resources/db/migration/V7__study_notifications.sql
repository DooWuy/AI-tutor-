CREATE TABLE study_notifications (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    user_id UUID NOT NULL,
    slot_id UUID NOT NULL,
    lesson_date DATE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    deep_link VARCHAR(512) NOT NULL,
    lesson_starts_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_study_notifications_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_study_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_study_notifications_slot FOREIGN KEY (slot_id) REFERENCES schedule_slots (id) ON DELETE CASCADE,
    CONSTRAINT uq_study_notifications_slot_date UNIQUE (slot_id, lesson_date)
);

CREATE INDEX idx_study_notifications_student_created
    ON study_notifications (student_id, created_at DESC);

CREATE INDEX idx_study_notifications_unread
    ON study_notifications (student_id)
    WHERE read_at IS NULL;

CREATE INDEX idx_schedule_slots_day_start
    ON schedule_slots (day_of_week, start_time);
