CREATE TABLE quiz_class_assignments (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL,
    class_id UUID NOT NULL,
    assigned_by_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_qca_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
    CONSTRAINT fk_qca_class FOREIGN KEY (class_id) REFERENCES school_classes (id) ON DELETE CASCADE,
    CONSTRAINT fk_qca_user FOREIGN KEY (assigned_by_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uk_qca_quiz_class UNIQUE (quiz_id, class_id)
);

CREATE INDEX idx_qca_class_id ON quiz_class_assignments (class_id);
CREATE INDEX idx_qca_quiz_id ON quiz_class_assignments (quiz_id);

-- Đề đã phát hành trước khi có gán lớp vẫn hiện với học sinh cùng khối.
INSERT INTO quiz_class_assignments (id, quiz_id, class_id, assigned_by_id, assigned_at)
SELECT gen_random_uuid(), q.id, c.id, q.created_by_id, NOW()
FROM quizzes q
JOIN school_classes c
  ON regexp_replace(c.grade_level, '[^0-9]', '', 'g') = regexp_replace(q.grade_level, '[^0-9]', '', 'g')
 AND regexp_replace(q.grade_level, '[^0-9]', '', 'g') <> ''
WHERE q.status = 'PUBLISHED';
