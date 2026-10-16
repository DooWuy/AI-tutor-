-- Read-only preflight on V1 before migrating. Review unexplained differences;
-- V2 preserves attempts and Student balances, never silently repairs either.
SELECT s.id AS student_id, s.total_xp,
       COALESCE(SUM(qa.xp_earned) FILTER (WHERE qa.xp_earned > 0), 0) AS historical_quiz_xp,
       s.total_xp - COALESCE(SUM(qa.xp_earned) FILTER (WHERE qa.xp_earned > 0), 0) AS difference
FROM students s
LEFT JOIN quiz_attempts qa ON qa.student_id = s.id
GROUP BY s.id, s.total_xp
HAVING s.total_xp <> COALESCE(SUM(qa.xp_earned) FILTER (WHERE qa.xp_earned > 0), 0)
ORDER BY s.id;
