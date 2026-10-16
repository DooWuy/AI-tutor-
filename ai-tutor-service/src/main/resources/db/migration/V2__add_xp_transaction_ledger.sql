-- Issue 5 / Task 1: immutable XP ledger and award snapshots.
-- Existing positive attempts are preserved as legacy transactions. Any unexplained
-- balance is reported for operator review; no synthetic XP is created.

ALTER TABLE quiz_attempts
    ADD COLUMN xp_award_status VARCHAR(32) NOT NULL DEFAULT 'LEGACY_UNKNOWN',
    ADD COLUMN daily_xp_earned INTEGER,
    ADD COLUMN daily_xp_cap INTEGER,
    ADD CONSTRAINT ck_quiz_attempts_xp_award_status CHECK (xp_award_status IN (
        'AWARDED', 'PARTIALLY_CAPPED', 'DAILY_CAP_REACHED',
        'ALREADY_REWARDED', 'NO_XP_EARNED', 'LEGACY_UNKNOWN'
    )),
    ADD CONSTRAINT ck_quiz_attempts_daily_xp_earned CHECK (daily_xp_earned IS NULL OR daily_xp_earned >= 0),
    ADD CONSTRAINT ck_quiz_attempts_daily_xp_cap CHECK (daily_xp_cap IS NULL OR daily_xp_cap > 0);

CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL,
    source_type VARCHAR(32) NOT NULL,
    source_id UUID NOT NULL,
    reference_id UUID,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT fk_xp_transactions_student
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_xp_transactions_attempt
        FOREIGN KEY (reference_id) REFERENCES quiz_attempts(id) ON DELETE RESTRICT,
    CONSTRAINT uk_xp_transactions_source UNIQUE (student_id, source_type, source_id),
    CONSTRAINT ck_xp_transactions_source_type CHECK (source_type IN (
        'QUIZ_FIRST_COMPLETION', 'LEGACY_QUIZ_ATTEMPT'
    )),
    CONSTRAINT ck_xp_transactions_amount CHECK (amount > 0),
    CONSTRAINT ck_xp_transactions_balance CHECK (balance_after >= amount)
);

CREATE INDEX idx_xp_transactions_student_occurred
    ON xp_transactions(student_id, occurred_at DESC);
CREATE INDEX idx_xp_transactions_occurred
    ON xp_transactions(occurred_at);
CREATE INDEX idx_students_total_xp
    ON students(total_xp DESC);

WITH positive_attempts AS (
    SELECT qa.id,
           qa.student_id,
           qa.xp_earned,
           COALESCE(qa.submitted_at, NOW()) AS occurred_at
    FROM quiz_attempts qa
    JOIN students s ON s.id = qa.student_id
    WHERE qa.xp_earned > 0
), ordered_attempts AS (
    SELECT id,
           student_id,
           xp_earned,
           occurred_at,
           SUM(xp_earned) OVER (
               PARTITION BY student_id
               ORDER BY occurred_at, id
               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
           ) AS balance_after
    FROM positive_attempts
)
INSERT INTO xp_transactions (
    id, student_id, source_type, source_id, reference_id,
    amount, balance_after, occurred_at, metadata
)
SELECT id,
       student_id,
       'LEGACY_QUIZ_ATTEMPT',
       id,
       id,
       xp_earned,
       balance_after,
       occurred_at,
       jsonb_build_object('backfilled', true, 'balanceReconstructedFromAttempts', true)
FROM ordered_attempts;

WITH mismatches AS (
    SELECT COUNT(*) AS mismatch_count
    FROM students s
    LEFT JOIN (
        SELECT student_id, SUM(amount) AS ledger_total
        FROM xp_transactions
        GROUP BY student_id
    ) ledger ON ledger.student_id = s.id
    WHERE COALESCE(ledger.ledger_total, 0) <> s.total_xp
), audit_id AS (
    SELECT md5('xp-ledger-v2-reconciliation') AS hash, mismatch_count
    FROM mismatches
)
INSERT INTO audit_logs(id, user_id, action, details, created_at)
SELECT (substr(hash, 1, 8) || '-' || substr(hash, 9, 4) || '-' || substr(hash, 13, 4)
        || '-' || substr(hash, 17, 4) || '-' || substr(hash, 21, 12))::uuid,
       NULL,
       'XP_RECONCILIATION_MISMATCH',
       'studentsWithMismatch=' || mismatch_count,
       NOW()
FROM audit_id
WHERE mismatch_count > 0;

CREATE TRIGGER trg_xp_transactions_immutable
    BEFORE UPDATE OR DELETE ON xp_transactions
    FOR EACH ROW
    EXECUTE FUNCTION reject_history_mutation();
