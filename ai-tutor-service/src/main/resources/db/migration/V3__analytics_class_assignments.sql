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
