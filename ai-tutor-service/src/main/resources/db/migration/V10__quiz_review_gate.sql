ALTER TABLE quizzes ADD COLUMN review_required boolean NOT NULL DEFAULT false;
-- Existing published content remains available; unpublished AI drafts require explicit review.
UPDATE quizzes SET review_required=true WHERE is_ai_generated AND status <> 'PUBLISHED';
