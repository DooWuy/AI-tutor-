package com.vn.aitutor.repository;

import com.vn.aitutor.dto.response.dashboard.AdminDashboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AdminDashboardRepository {
    // Scalar subqueries avoid join multiplication and entity hydration. One statement = one MVCC snapshot.
    public static final String COUNTS_SQL = """
        SELECT (SELECT count(*) FROM users WHERE NOT is_deleted) AS total_users,
               (SELECT count(*) FROM documents) AS total_documents,
               (SELECT count(*) FROM quizzes) AS total_quizzes,
               (SELECT count(*) FROM chat_sessions) AS chat_count,
               (SELECT count(*) FROM quiz_attempts WHERE submitted_at IS NOT NULL) AS attempt_count,
               statement_timestamp() AS updated_at
        """;
    private final JdbcTemplate jdbc;
    public AdminDashboardResponse overview() {
        return jdbc.queryForObject(COUNTS_SQL, (rs, row) -> new AdminDashboardResponse(
                rs.getLong("total_users"), rs.getLong("total_documents"), rs.getLong("total_quizzes"),
                rs.getLong("chat_count"), rs.getLong("attempt_count"), rs.getTimestamp("updated_at").toInstant()));
    }
}
