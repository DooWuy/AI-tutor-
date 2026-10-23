CREATE TABLE quiz_study_class_assignments (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL,
    study_class_id UUID NOT NULL,
    assigned_by_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_qsca_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
    CONSTRAINT fk_qsca_study_class FOREIGN KEY (study_class_id) REFERENCES study_classes (id) ON DELETE CASCADE,
    CONSTRAINT fk_qsca_user FOREIGN KEY (assigned_by_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT uk_qsca_quiz_class UNIQUE (quiz_id, study_class_id)
);

CREATE INDEX idx_qsca_study_class_id ON quiz_study_class_assignments (study_class_id);
CREATE INDEX idx_qsca_quiz_id ON quiz_study_class_assignments (quiz_id);
