ALTER TABLE students
    ADD COLUMN parent_name VARCHAR(255),
    ADD COLUMN parent_email VARCHAR(255),
    ADD COLUMN parent_phone VARCHAR(32);

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
