-- Read-only report after V2. No balance repairs or synthetic awards.
SELECT s.id AS student_id, s.total_xp,
       COALESCE(ledger.amount, 0) AS ledger_xp,
       s.total_xp - COALESCE(ledger.amount, 0) AS difference
FROM students s
LEFT JOIN (
    SELECT student_id, SUM(amount) AS amount
    FROM xp_transactions GROUP BY student_id
) ledger ON ledger.student_id = s.id
WHERE s.total_xp <> COALESCE(ledger.amount, 0)
ORDER BY s.id;
