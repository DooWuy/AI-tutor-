CREATE TABLE books (
    id UUID PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    subject VARCHAR(32) NOT NULL,
    grade_level VARCHAR(8) NOT NULL,
    curriculum_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_books_grade_level CHECK (grade_level IN ('10', '11', '12'))
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

ALTER TABLE documents
    ADD COLUMN lesson_id UUID,
    ADD COLUMN document_type VARCHAR(32),
    ADD COLUMN error_message TEXT;

ALTER TABLE documents
    ADD CONSTRAINT fk_documents_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE RESTRICT;

ALTER TABLE documents
    ADD CONSTRAINT ck_documents_type CHECK (
        document_type IS NULL OR document_type IN ('THEORY', 'EXERCISE', 'EXAM')
    );

CREATE INDEX idx_documents_lesson_id ON documents (lesson_id);
