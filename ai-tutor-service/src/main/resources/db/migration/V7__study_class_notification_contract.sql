ALTER TABLE notifications
    DROP CONSTRAINT ck_notifications_source_type,
    ADD CONSTRAINT ck_notifications_source_type CHECK (
        source_type IS NULL OR source_type IN (
            'SCHEDULE_SLOT',
            'QUIZ',
            'GENERATION_JOB',
            'STUDY_CLASS_ENROLLMENT'
        )
    );
