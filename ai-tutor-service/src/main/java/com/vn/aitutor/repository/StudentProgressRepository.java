package com.vn.aitutor.repository;

import com.vn.aitutor.dto.response.StudentProgressResponse.RecentQuiz;
import com.vn.aitutor.dto.response.StudentProgressResponse.SubjectStats;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class StudentProgressRepository {
    private final JdbcTemplate jdbc;

    public record DailyQuiz(LocalDate date, long count, long seconds) { }
    public record DailyXp(LocalDate date, long amount) { }

    public List<DailyQuiz> dailyQuizzes(UUID studentId, Instant from, Instant to, String zone) {
        return jdbc.query("""
                SELECT (submitted_at AT TIME ZONE ?)::date AS day, COUNT(*) AS count,
                       COALESCE(SUM(GREATEST(COALESCE(duration_seconds, 0), 0)), 0) AS seconds
                FROM quiz_attempts
                WHERE student_id = ? AND submitted_at >= ? AND submitted_at < ?
                GROUP BY 1 ORDER BY 1
                """, (rs, i) -> new DailyQuiz(rs.getObject("day", LocalDate.class),
                rs.getLong("count"), rs.getLong("seconds")), zone, studentId,
                Timestamp.from(from), Timestamp.from(to));
    }

    public List<DailyXp> dailyXp(UUID studentId, Instant from, Instant to, String zone) {
        return jdbc.query("""
                SELECT (occurred_at AT TIME ZONE ?)::date AS day, SUM(amount) AS amount
                FROM xp_transactions
                WHERE student_id = ? AND occurred_at >= ? AND occurred_at < ?
                GROUP BY 1 ORDER BY 1
                """, (rs, i) -> new DailyXp(rs.getObject("day", LocalDate.class), rs.getLong("amount")),
                zone, studentId, Timestamp.from(from), Timestamp.from(to));
    }

    public List<SubjectStats> subjects(UUID studentId) {
        // Aggregate ledger by subject before joining; repeated quiz attempts cannot multiply XP.
        return jdbc.query("""
                WITH scores AS (
                    SELECT q.subject, COUNT(*) AS count, AVG(a.score) AS average, MAX(a.score) AS best
                    FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
                    WHERE a.student_id = ? GROUP BY q.subject
                ), xp AS (
                    SELECT q.subject, SUM(tx.amount) AS amount
                    FROM xp_transactions tx
                    JOIN quiz_attempts a ON a.id = tx.reference_id AND a.student_id = tx.student_id
                    JOIN quizzes q ON q.id = a.quiz_id
                    WHERE tx.student_id = ? GROUP BY q.subject
                )
                SELECT s.subject, s.count, s.average, s.best, COALESCE(x.amount, 0) AS xp
                FROM scores s LEFT JOIN xp x ON x.subject IS NOT DISTINCT FROM s.subject
                ORDER BY s.subject NULLS LAST
                """, (rs, i) -> new SubjectStats(rs.getString("subject"), rs.getLong("count"),
                rs.getObject("average", Double.class), rs.getObject("best", Double.class), rs.getLong("xp")),
                studentId, studentId);
    }

    public List<RecentQuiz> recentQuizzes(UUID studentId) {
        return jdbc.query("""
                SELECT a.id, a.quiz_id, q.title, q.subject, a.score, a.xp_earned,
                       a.duration_seconds, a.submitted_at
                FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
                WHERE a.student_id = ? AND a.is_visible = TRUE
                ORDER BY a.submitted_at DESC NULLS LAST, a.id DESC LIMIT 5
                """, (rs, i) -> new RecentQuiz(rs.getObject("id", UUID.class), rs.getObject("quiz_id", UUID.class),
                rs.getString("title"), rs.getString("subject"), rs.getObject("score", Double.class),
                rs.getInt("xp_earned"), rs.getObject("duration_seconds", Integer.class),
                rs.getTimestamp("submitted_at") == null ? null : rs.getTimestamp("submitted_at").toInstant()), studentId);
    }
}
