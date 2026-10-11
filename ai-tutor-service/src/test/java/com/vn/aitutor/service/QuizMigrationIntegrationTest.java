package com.vn.aitutor.service;

import java.sql.*;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "QUIZ_UPGRADE_DB_URL", matches = ".+")
class QuizMigrationIntegrationTest {
    @Test void upgradeFromV3PreservesCompletedHistory() throws Exception {
        String url = System.getenv("QUIZ_UPGRADE_DB_URL");
        String username = System.getenv("DB_USERNAME"); String password = System.getenv("DB_PASSWORD");
        Flyway.configure().dataSource(url, username, password).target("3").load().migrate();
        UUID user = UUID.randomUUID(), student = UUID.randomUUID(), quiz = UUID.randomUUID(), attempt = UUID.randomUUID();
        try (Connection connection = DriverManager.getConnection(url, username, password); Statement sql = connection.createStatement()) {
            sql.executeUpdate("INSERT INTO users(id,username,email,password_hash,full_name,gender,role) VALUES ('"+user+"','migration-"+user+"','"+user+"@example.invalid','unused','Migration','OTHER','STUDENT')");
            sql.executeUpdate("INSERT INTO students(id,user_id,student_code,total_xp) VALUES ('"+student+"','"+user+"','"+student+"',20)");
            sql.executeUpdate("INSERT INTO quizzes(id,title,difficulty,created_by_id) VALUES ('"+quiz+"','Historical quiz','EASY','"+user+"')");
            sql.executeUpdate("INSERT INTO quiz_attempts(id,quiz_id,student_id,score,xp_earned,submitted_at) VALUES ('"+attempt+"','"+quiz+"','"+student+"',7,10,now()), ('"+UUID.randomUUID()+"','"+quiz+"','"+student+"',8,10,now())");
        }
        assertEquals(2, Flyway.configure().dataSource(url, username, password).load().migrate().migrationsExecuted);
        try (Connection connection = DriverManager.getConnection(url, username, password); Statement sql = connection.createStatement()) {
            ResultSet row = sql.executeQuery("SELECT score,xp_earned,is_visible,source_draft_id FROM quiz_attempts WHERE id='"+attempt+"'");
            assertTrue(row.next()); assertEquals(7, row.getDouble(1)); assertEquals(10, row.getInt(2)); assertTrue(row.getBoolean(3)); assertNull(row.getObject(4));
            assertEquals(1, sql.executeUpdate("UPDATE quiz_attempts SET is_visible=false WHERE id='"+attempt+"'"));
            assertThrows(SQLException.class, () -> sql.executeUpdate("UPDATE quiz_attempts SET score=9 WHERE id='"+attempt+"'"));
            row = sql.executeQuery("SELECT total_xp FROM students WHERE id='"+student+"'"); assertTrue(row.next()); assertEquals(20, row.getInt(1));
        }
    }
}
