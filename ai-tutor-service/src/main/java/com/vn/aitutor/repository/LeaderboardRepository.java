package com.vn.aitutor.repository;

import com.vn.aitutor.repository.projection.LeaderboardRow;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class LeaderboardRepository {
    private final JdbcTemplate jdbc;

    // Exposed constants also let PostgreSQL integration tests explain the exact production queries.
    public static final String GLOBAL_QUERY = query(false);
    public static final String CLASS_QUERY = query(true);

    private static String query(boolean classScope) {
        return """
                WITH eligible AS (
                    SELECT s.id, s.total_xp, u.full_name, u.avatar_url
                    FROM students s JOIN users u ON u.id = s.user_id
                    WHERE u.role = 'STUDENT' AND u.is_active = TRUE AND u.is_deleted = FALSE
                """ + (classScope ? " AND s.class_id = ?\n" : "") + """
                ), history AS (
                    SELECT tx.student_id, SUM(tx.amount) AS ledger_total,
                           MIN(tx.occurred_at) FILTER (WHERE tx.balance_after = e.total_xp) AS reached_at
                    FROM xp_transactions tx JOIN eligible e ON e.id = tx.student_id
                    GROUP BY tx.student_id
                ), scored AS (
                    SELECT e.*,
                           CASE WHEN e.total_xp > 0 AND h.ledger_total = e.total_xp
                                THEN h.reached_at ELSE NULL END AS reached_at
                    FROM eligible e LEFT JOIN history h ON h.student_id = e.id
                ), ranked AS (
                    SELECT id, full_name, avatar_url, total_xp,
                           ROW_NUMBER() OVER (ORDER BY total_xp DESC, reached_at ASC NULLS LAST, id ASC) AS rank
                    FROM scored
                )
                SELECT rank, full_name, avatar_url, total_xp, id = ? AS is_me
                FROM ranked WHERE rank <= ? OR id = ? ORDER BY rank
                """;
    }

    public List<LeaderboardRow> findRanking(UUID studentId, UUID classId, int limit) {
        Object[] args = classId == null ? new Object[] {studentId, limit, studentId}
                : new Object[] {classId, studentId, limit, studentId};
        return jdbc.query(classId == null ? GLOBAL_QUERY : CLASS_QUERY,
                (rs, i) -> new LeaderboardRow(rs.getLong("rank"), rs.getString("full_name"),
                        rs.getString("avatar_url"), rs.getInt("total_xp"), rs.getBoolean("is_me")), args);
    }
}
