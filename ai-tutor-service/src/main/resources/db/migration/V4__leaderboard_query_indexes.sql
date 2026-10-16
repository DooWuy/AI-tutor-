-- GLOBAL already has idx_students_total_xp from V2. Class filtering and ledger
-- aggregation get supporting indexes without introducing denormalized XP state.
CREATE INDEX idx_students_class_xp ON students(class_id, total_xp DESC, id);
CREATE INDEX idx_xp_transactions_student_ranking
    ON xp_transactions(student_id) INCLUDE (amount, balance_after, occurred_at);
