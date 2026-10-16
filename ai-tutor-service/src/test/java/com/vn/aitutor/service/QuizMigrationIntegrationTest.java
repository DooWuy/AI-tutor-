package com.vn.aitutor.service;

import java.sql.*;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "QUIZ_UPGRADE_DB_URL", matches = ".+")
class QuizMigrationIntegrationTest {
    @Test void upgradeFromV1BackfillsLedgerAndPreservesCompletedHistory() throws Exception {
        String url = System.getenv("QUIZ_UPGRADE_DB_URL");
        String username = System.getenv("DB_USERNAME"); String password = System.getenv("DB_PASSWORD");
        Flyway.configure().dataSource(url, username, password).target("1").load().migrate();
        UUID user = UUID.randomUUID(), student = UUID.randomUUID(), quiz = UUID.randomUUID(), attempt = UUID.randomUUID();
        UUID highUser = UUID.randomUUID(), highStudent = UUID.randomUUID();
        UUID lowUser = UUID.randomUUID(), lowStudent = UUID.randomUUID();
        try (Connection connection = DriverManager.getConnection(url, username, password); Statement sql = connection.createStatement()) {
            sql.executeUpdate("INSERT INTO users(id,username,email,password_hash,full_name,gender,role) VALUES ('"+user+"','migration-"+user+"','"+user+"@example.invalid','unused','Migration','OTHER','STUDENT')");
            sql.executeUpdate("INSERT INTO students(id,user_id,student_code,total_xp) VALUES ('"+student+"','"+user+"','"+student+"',20)");
            sql.executeUpdate("INSERT INTO quizzes(id,title,difficulty,created_by_id) VALUES ('"+quiz+"','Historical quiz','EASY','"+user+"')");
            sql.executeUpdate("INSERT INTO quiz_attempts(id,quiz_id,student_id,score,xp_earned,submitted_at) VALUES ('"+attempt+"','"+quiz+"','"+student+"',7,10,now()), ('"+UUID.randomUUID()+"','"+quiz+"','"+student+"',8,10,now())");
            for (UUID[] pair : new UUID[][] {{highUser, highStudent}, {lowUser, lowStudent}}) {
                sql.executeUpdate("INSERT INTO users(id,username,email,password_hash,full_name,gender,role) VALUES ('"+pair[0]+"','migration-"+pair[0]+"','"+pair[0]+"@example.invalid','unused','Migration','OTHER','STUDENT')");
                sql.executeUpdate("INSERT INTO students(id,user_id,student_code,total_xp) VALUES ('"+pair[1]+"','"+pair[0]+"','"+pair[1]+"',"+(pair[1].equals(highStudent) ? 30 : 5)+")");
                sql.executeUpdate("INSERT INTO quiz_attempts(id,quiz_id,student_id,score,xp_earned,submitted_at) VALUES ('"+UUID.randomUUID()+"','"+quiz+"','"+pair[1]+"',7,10,now())");
            }
        }
        assertEquals(1, Flyway.configure().dataSource(url, username, password).target("2").load().migrate().migrationsExecuted);
        assertEquals(1, Flyway.configure().dataSource(url, username, password).target("3").load().migrate().migrationsExecuted);
        assertEquals(1, Flyway.configure().dataSource(url, username, password).target("4").load().migrate().migrationsExecuted);
        assertEquals(1, Flyway.configure().dataSource(url, username, password).load().migrate().migrationsExecuted);
        try (Connection connection = DriverManager.getConnection(url, username, password); Statement sql = connection.createStatement()) {
            ResultSet row = sql.executeQuery("SELECT score,xp_earned,is_visible,source_draft_id,xp_award_status FROM quiz_attempts WHERE id='"+attempt+"'");
            assertTrue(row.next()); assertEquals(7, row.getDouble(1)); assertEquals(10, row.getInt(2)); assertTrue(row.getBoolean(3)); assertNull(row.getObject(4));
            assertEquals("LEGACY_UNKNOWN", row.getString(5));
            assertEquals(1, sql.executeUpdate("UPDATE quiz_attempts SET is_visible=false WHERE id='"+attempt+"'"));
            assertThrows(SQLException.class, () -> sql.executeUpdate("UPDATE quiz_attempts SET score=9 WHERE id='"+attempt+"'"));
            row = sql.executeQuery("SELECT total_xp FROM students WHERE id='"+student+"'"); assertTrue(row.next()); assertEquals(20, row.getInt(1));
            row = sql.executeQuery("SELECT COUNT(*),SUM(amount),MAX(balance_after) FROM xp_transactions WHERE student_id='"+student+"'");
            assertTrue(row.next()); assertEquals(2, row.getInt(1)); assertEquals(20, row.getInt(2)); assertEquals(20, row.getInt(3));
            assertThrows(SQLException.class, () -> sql.executeUpdate("UPDATE xp_transactions SET amount=99 WHERE student_id='"+student+"'"));
            row = sql.executeQuery("SELECT total_xp,(SELECT SUM(amount) FROM xp_transactions WHERE student_id=s.id) FROM students s WHERE id='"+highStudent+"'");
            assertTrue(row.next()); assertEquals(30, row.getInt(1)); assertEquals(10, row.getInt(2));
            row = sql.executeQuery("SELECT total_xp,(SELECT SUM(amount) FROM xp_transactions WHERE student_id=s.id) FROM students s WHERE id='"+lowStudent+"'");
            assertTrue(row.next()); assertEquals(5, row.getInt(1)); assertEquals(10, row.getInt(2));
            row = sql.executeQuery("SELECT details FROM audit_logs WHERE action='XP_RECONCILIATION_MISMATCH'");
            assertTrue(row.next()); assertEquals("studentsWithMismatch=2", row.getString(1));
            assertThrows(SQLException.class, () -> sql.executeUpdate("INSERT INTO xp_transactions SELECT gen_random_uuid(),student_id,source_type,source_id,reference_id,amount,balance_after,occurred_at,metadata FROM xp_transactions WHERE student_id='"+student+"' LIMIT 1"));
            assertThrows(SQLException.class, () -> sql.executeUpdate("DELETE FROM xp_transactions WHERE student_id='"+student+"'"));
            assertEquals(0, Flyway.configure().dataSource(url, username, password).load().migrate().migrationsExecuted);

        }
    }
}
