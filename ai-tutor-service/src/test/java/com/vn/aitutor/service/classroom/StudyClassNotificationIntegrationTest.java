package com.vn.aitutor.service.classroom;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.dto.request.classroom.EnrollmentActionRequest;
import com.vn.aitutor.dto.request.classroom.StudyClassJoinRequest;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.StudyClassEnrollmentRepository;
import com.vn.aitutor.repository.StudyClassRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.system.notification.NotificationCreationService;
import jakarta.persistence.EntityManagerFactory;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.SharedEntityManagerCreator;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import tools.jackson.databind.json.JsonMapper;

@Testcontainers(disabledWithoutDocker = true)
@SpringJUnitConfig(StudyClassNotificationIntegrationTest.Config.class)
class StudyClassNotificationIntegrationTest {
    private static final Instant NOW = Instant.parse("2026-10-24T08:00:00Z");

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(
            DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres"));

    @Autowired JdbcTemplate jdbc;
    @Autowired StudyClassService service;

    UUID teacherUserId;
    UUID teacherId;
    UUID classId;
    UserPrincipal teacherPrincipal;
    UserPrincipal firstStudentPrincipal;
    UserPrincipal secondStudentPrincipal;

    @BeforeEach
    void setUp() {
        jdbc.execute("DROP TRIGGER IF EXISTS fail_study_class_notification ON notification_deliveries");
        jdbc.execute("DROP FUNCTION IF EXISTS reject_study_class_delivery()");
        jdbc.execute("TRUNCATE users CASCADE");
        teacherUserId = user("TEACHER", "Giáo viên Toán");
        teacherId = UUID.randomUUID();
        jdbc.update("INSERT INTO teachers (id, user_id, teacher_code) VALUES (?, ?, ?)",
                teacherId, teacherUserId, "GV-" + teacherId);
        firstStudentPrincipal = student("Học sinh Một");
        secondStudentPrincipal = student("Học sinh Hai");
        classId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO study_classes (id, name, class_code, teacher_id, status, max_students, start_date)
                VALUES (?, 'Lớp Toán 5A', 'AB12CD', ?, 'ACTIVE', 1, DATE '2026-10-01')
                """, classId, teacherId);
        teacherPrincipal = principal(teacherUserId, Role.TEACHER, "Giáo viên Toán");
    }

    @AfterEach
    void cleanTrigger() {
        jdbc.execute("DROP TRIGGER IF EXISTS fail_study_class_notification ON notification_deliveries");
        jdbc.execute("DROP FUNCTION IF EXISTS reject_study_class_delivery()");
    }

    @Test
    void joinCreatesOwnedReadModelAndTeacherNotificationAtomically() {
        var joined = service.join(firstStudentPrincipal, join("AB12CD"));

        assertEquals(classId, joined.getClassId());
        assertEquals(NOW, joined.getRequestedAt());
        assertEquals(1, count("study_class_enrollments"));
        assertNotification(teacherUserId, "STUDY_CLASS_JOIN_REQUESTED", "PENDING");
        var list = service.listForStudent(firstStudentPrincipal);
        assertEquals(1, list.size());
        assertEquals(joined.getEnrollmentId(), list.get(0).getEnrollmentId());
        assertEquals("Giáo viên Toán", list.get(0).getTeacherName());
        assertEquals(joined.getEnrollmentId(),
                service.getForStudent(firstStudentPrincipal, classId).getEnrollmentId());
        assertThrows(ResourceNotFoundException.class,
                () -> service.getForStudent(secondStudentPrincipal, classId));
    }

    @Test
    void deliveryInsertFailureRollsBackJoinAndNotification() {
        failDeliveryInsert();

        assertThrows(RuntimeException.class, () -> service.join(firstStudentPrincipal, join("AB12CD")));

        assertEquals(0, count("study_class_enrollments"));
        assertEquals(0, count("notifications"));
    }

    @Test
    void concurrentDuplicateJoinCreatesOneEnrollmentAndOneNotification() throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        Callable<String> join = () -> {
            start.await(10, TimeUnit.SECONDS);
            try {
                service.join(firstStudentPrincipal, join("AB12CD"));
                return "CREATED";
            } catch (ResourceConflictException ex) {
                return "CONFLICT";
            }
        };
        var executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(join);
            var second = executor.submit(join);
            start.countDown();
            var outcomes = java.util.Set.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS));
            assertEquals(java.util.Set.of("CREATED", "CONFLICT"), outcomes);
        } finally {
            executor.shutdownNow();
        }
        assertEquals(1, count("study_class_enrollments"));
        assertEquals(1, count("notifications"));
        assertEquals(1, count("notification_deliveries"));
    }

    @Test
    void concurrentApprovalsCannotExceedCapacity() throws Exception {
        UUID firstEnrollment = pendingEnrollment(firstStudentPrincipal);
        UUID secondEnrollment = pendingEnrollment(secondStudentPrincipal);
        CountDownLatch start = new CountDownLatch(1);
        Callable<String> approveFirst = () -> approveAfter(start, firstEnrollment);
        Callable<String> approveSecond = () -> approveAfter(start, secondEnrollment);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(approveFirst);
            var second = executor.submit(approveSecond);
            start.countDown();
            var outcomes = java.util.Set.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS));
            assertEquals(java.util.Set.of("APPROVED", "FULL"), outcomes);
        } finally {
            executor.shutdownNow();
        }
        assertEquals(1, jdbc.queryForObject(
                "SELECT count(*) FROM study_class_enrollments WHERE status = 'APPROVED'", Integer.class));
        assertEquals(1, jdbc.queryForObject(
                "SELECT count(*) FROM study_class_enrollments WHERE status = 'PENDING'", Integer.class));
        assertEquals(1, jdbc.queryForObject(
                "SELECT count(*) FROM notifications WHERE type = 'STUDY_CLASS_JOIN_APPROVED'", Integer.class));
    }

    @Test
    void notificationFailureRollsBackEnrollmentDecision() {
        UUID enrollmentId = pendingEnrollment(firstStudentPrincipal);
        failDeliveryInsert();

        assertThrows(RuntimeException.class,
                () -> service.act(teacherPrincipal, classId, enrollmentId, action("approve")));

        assertEquals("PENDING", jdbc.queryForObject(
                "SELECT status FROM study_class_enrollments WHERE id = ?", String.class, enrollmentId));
        assertEquals(0, count("notifications"));
    }

    @Test
    void rejectedStudentCanRejoinWithANewRequestCycle() {
        UUID enrollmentId = pendingEnrollment(firstStudentPrincipal);
        jdbc.update("""
                UPDATE study_class_enrollments
                SET status = 'REJECTED', reviewed_at = ?, requested_at = ?
                WHERE id = ?
                """, java.sql.Timestamp.from(NOW.plusSeconds(10)), java.sql.Timestamp.from(NOW), enrollmentId);

        var joined = service.join(firstStudentPrincipal, join("AB12CD"));

        assertEquals(enrollmentId, joined.getEnrollmentId());
        assertTrue(joined.getRequestedAt().isAfter(NOW));
        assertEquals("PENDING", jdbc.queryForObject(
                "SELECT status FROM study_class_enrollments WHERE id = ?", String.class, enrollmentId));
        assertEquals(1, jdbc.queryForObject(
                "SELECT count(*) FROM notifications WHERE type = 'STUDY_CLASS_JOIN_REQUESTED'", Integer.class));
        assertTrue(jdbc.queryForObject(
                "SELECT event_key FROM notifications WHERE type = 'STUDY_CLASS_JOIN_REQUESTED'", String.class)
                .contains(joined.getRequestedAt().toString()));
    }

    private String approveAfter(CountDownLatch start, UUID enrollmentId) throws Exception {
        start.await(10, TimeUnit.SECONDS);
        try {
            service.act(teacherPrincipal, classId, enrollmentId, action("approve"));
            return "APPROVED";
        } catch (ResourceBadRequestException ex) {
            assertTrue(ex.getMessage().contains("đủ sĩ số"));
            return "FULL";
        }
    }

    private UUID pendingEnrollment(UserPrincipal principal) {
        UUID studentId = jdbc.queryForObject(
                "SELECT id FROM students WHERE user_id = ?", UUID.class, principal.getUsers().getId());
        UUID enrollmentId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO study_class_enrollments (id, class_id, student_id, status, requested_at)
                VALUES (?, ?, ?, 'PENDING', ?)
                """, enrollmentId, classId, studentId, java.sql.Timestamp.from(NOW));
        return enrollmentId;
    }

    private UserPrincipal student(String fullName) {
        UUID userId = user("STUDENT", fullName);
        UUID studentId = UUID.randomUUID();
        jdbc.update("INSERT INTO students (id, user_id, student_code) VALUES (?, ?, ?)",
                studentId, userId, "HS-" + studentId);
        return principal(userId, Role.STUDENT, fullName);
    }

    private UUID user(String role, String fullName) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, username, email, password_hash, full_name, gender, role)
                VALUES (?, ?, ?, 'unused', ?, 'OTHER', ?)
                """, id, "class-" + id, id + "@example.invalid", fullName, role);
        return id;
    }

    private UserPrincipal principal(UUID id, Role role, String fullName) {
        User user = new User();
        user.setId(id);
        user.setRole(role);
        user.setFullName(fullName);
        return UserPrincipal.builder().users(user).build();
    }

    private StudyClassJoinRequest join(String code) {
        StudyClassJoinRequest request = new StudyClassJoinRequest();
        request.setClassCode(code);
        return request;
    }

    private EnrollmentActionRequest action(String value) {
        EnrollmentActionRequest request = new EnrollmentActionRequest();
        request.setAction(value);
        return request;
    }

    private void assertNotification(UUID recipient, String type, String status) {
        Map<String, Object> row = jdbc.queryForMap("""
                SELECT n.user_id, n.type, n.source_type, n.metadata->>'enrollmentStatus' AS enrollment_status,
                       d.channel
                FROM notifications n JOIN notification_deliveries d ON d.notification_id = n.id
                """);
        assertEquals(recipient, row.get("user_id"));
        assertEquals(type, row.get("type"));
        assertEquals("STUDY_CLASS_ENROLLMENT", row.get("source_type"));
        assertEquals(status, row.get("enrollment_status"));
        assertEquals("WEBSOCKET", row.get("channel"));
    }

    private int count(String table) {
        return jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class);
    }

    private void failDeliveryInsert() {
        jdbc.execute("""
                CREATE FUNCTION reject_study_class_delivery() RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN RAISE EXCEPTION 'simulated notification insert failure'; END $$
                """);
        jdbc.execute("""
                CREATE TRIGGER fail_study_class_notification BEFORE INSERT ON notification_deliveries
                FOR EACH ROW EXECUTE FUNCTION reject_study_class_delivery()
                """);
    }

    @Configuration
    @EnableTransactionManagement
    static class Config {
        @Bean DataSource dataSource() {
            return new DriverManagerDataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
        }
        @Bean Flyway flyway(DataSource dataSource) {
            Flyway flyway = Flyway.configure().dataSource(dataSource).load();
            flyway.migrate();
            return flyway;
        }
        @Bean @DependsOn("flyway") LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            var factory = new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(dataSource);
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setPackagesToScan("com.vn.aitutor.entity");
            factory.setJpaPropertyMap(Map.of(
                    "hibernate.hbm2ddl.auto", "validate",
                    "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl"));
            return factory;
        }
        @Bean PlatformTransactionManager transactionManager(EntityManagerFactory factory, DataSource dataSource) {
            var manager = new JpaTransactionManager(factory);
            manager.setDataSource(dataSource);
            return manager;
        }
        @Bean JdbcTemplate jdbc(DataSource dataSource) { return new JdbcTemplate(dataSource); }
        private <T> T repository(Class<T> type, EntityManagerFactory factory) {
            return new JpaRepositoryFactory(SharedEntityManagerCreator.createSharedEntityManager(factory)).getRepository(type);
        }
        @Bean StudyClassRepository studyClasses(EntityManagerFactory factory) {
            return repository(StudyClassRepository.class, factory);
        }
        @Bean StudyClassEnrollmentRepository enrollments(EntityManagerFactory factory) {
            return repository(StudyClassEnrollmentRepository.class, factory);
        }
        @Bean TeacherRepository teachers(EntityManagerFactory factory) {
            return repository(TeacherRepository.class, factory);
        }
        @Bean StudentRepository students(EntityManagerFactory factory) {
            return repository(StudentRepository.class, factory);
        }
        @Bean Clock learningClock() { return Clock.fixed(NOW, ZoneOffset.UTC); }
        @Bean NotificationCreationService notifications(JdbcTemplate jdbc, Clock clock) {
            return new NotificationCreationService(jdbc, JsonMapper.builder().build(), clock);
        }
        @Bean StudyClassService studyClassService(StudyClassRepository classes,
                StudyClassEnrollmentRepository enrollments, TeacherRepository teachers,
                StudentRepository students, NotificationCreationService notifications, Clock clock) {
            return new StudyClassService(classes, enrollments, teachers, students, notifications, clock);
        }
    }
}
