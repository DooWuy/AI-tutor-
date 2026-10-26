package com.vn.aitutor.service.quiz;

import static org.junit.jupiter.api.Assertions.*;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@Testcontainers(disabledWithoutDocker = true)
class QuizStudyClassAssignmentMigrationTest {
    @Container
    final PostgreSQLContainer postgres = new PostgreSQLContainer(
            DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres"));

    private Flyway flyway(String target, boolean validate) {
        return Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .target(target).validateOnMigrate(validate).load();
    }

    @Test
    void upgradesLegacyV7WhoseAppliedV5DidNotCreateAssignmentTable() throws Exception {
        flyway("7", true).migrate();
        try (Connection connection = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             Statement sql = connection.createStatement()) {
            // Reproduce the deployed database: V5 is recorded but this table is absent.
            sql.execute("DROP TABLE quiz_study_class_assignments");
            sql.execute("UPDATE flyway_schema_history SET description='study class notification contract', checksum=0 WHERE version='5'");
            assertEquals(1, flyway("8", false).migrate().migrationsExecuted);
            try (var row = sql.executeQuery("SELECT count(*) FROM users")) {
                assertTrue(row.next());
                assertEquals(1, row.getInt(1), "Keep the seeded admin account");
            }
            try (var row = sql.executeQuery("SELECT count(*) FROM quiz_study_class_assignments")) {
                assertTrue(row.next());
                assertEquals(0, row.getInt(1));
            }
            try (var row = sql.executeQuery("SELECT count(*) FROM pg_constraint WHERE conrelid='quiz_study_class_assignments'::regclass AND contype='f'")) {
                assertTrue(row.next());
                assertEquals(3, row.getInt(1));
            }
            assertEquals(0, flyway("8", false).migrate().migrationsExecuted);
        }
    }

    @Test
    void freshInstallCanApplyBothCurrentV5AndRepairV8() throws Exception {
        assertEquals(8, flyway("8", true).migrate().migrationsExecuted);
        assertEquals(0, flyway("8", true).migrate().migrationsExecuted);
    }
}
