ALTER TABLE question_bank DROP CONSTRAINT IF EXISTS ck_question_bank_type;
ALTER TABLE question_bank ADD CONSTRAINT ck_question_bank_type
    CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MULTI_SELECT'));

ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS ck_quiz_questions_type;
ALTER TABLE quiz_questions ADD CONSTRAINT ck_quiz_questions_type
    CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'MULTI_SELECT'));
