CREATE TABLE study_classes (
    id UUID PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(1000),
    class_code VARCHAR(6) NOT NULL,
    teacher_id UUID NOT NULL,
    status VARCHAR(16) NOT NULL,
    max_students INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_study_classes_teacher FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE RESTRICT,
    CONSTRAINT uk_study_classes_code UNIQUE (class_code),
    CONSTRAINT ck_study_classes_status CHECK (status IN ('ACTIVE', 'DISSOLVED')),
    CONSTRAINT ck_study_classes_max CHECK (max_students BETWEEN 1 AND 200)
);

CREATE INDEX idx_study_classes_teacher_status ON study_classes (teacher_id, status);

CREATE TABLE study_class_enrollments (
    id UUID PRIMARY KEY,
    class_id UUID NOT NULL,
    student_id UUID NOT NULL,
    status VARCHAR(16) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT fk_study_enrollments_class FOREIGN KEY (class_id) REFERENCES study_classes (id) ON DELETE CASCADE,
    CONSTRAINT fk_study_enrollments_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT uk_study_enrollments_class_student UNIQUE (class_id, student_id),
    CONSTRAINT ck_study_enrollments_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_study_enrollments_class_status ON study_class_enrollments (class_id, status);
