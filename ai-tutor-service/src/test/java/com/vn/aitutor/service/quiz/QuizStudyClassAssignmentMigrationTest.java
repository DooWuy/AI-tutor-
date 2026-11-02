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
    void freshInstallAppliesConsolidatedV1() throws Exception {
        assertEquals(1, flyway("1", true).migrate().migrationsExecuted);
        assertEquals(0, flyway("1", true).migrate().migrationsExecuted);

        try (Connection connection = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             Statement sql = connection.createStatement()) {
            try (var row = sql.executeQuery("SELECT count(*) FROM users")) {
                assertTrue(row.next());
                assertEquals(2, row.getInt(1), "Keep the seeded admin and teacher accounts");
            }
            try (var row = sql.executeQuery("SELECT count(*) FROM teachers")) {
                assertTrue(row.next());
                assertEquals(1, row.getInt(1), "Keep the seeded teacher account");
            }
            try (var row = sql.executeQuery("SELECT count(*) FROM quiz_study_class_assignments")) {
                assertTrue(row.next());
                assertEquals(0, row.getInt(1));
            }
            try (var row = sql.executeQuery("SELECT count(*) FROM pg_constraint WHERE conrelid='quiz_study_class_assignments'::regclass AND contype='f'")) {
                assertTrue(row.next());
                assertEquals(3, row.getInt(1));
            }
        }
    }
}
