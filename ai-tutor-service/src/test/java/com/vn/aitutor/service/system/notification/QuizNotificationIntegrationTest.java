package com.vn.aitutor.service.system.notification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.ai.agent.QuestionGeneratorAgent;
import com.vn.aitutor.dto.request.quiz.*;
import com.vn.aitutor.dto.response.quiz.QuestionBankListResponse;
import com.vn.aitutor.entity.enums.*;
import com.vn.aitutor.mq.consumer.QuizGenerationConsumer;
import com.vn.aitutor.repository.*;
import com.vn.aitutor.service.job.GenerationJobStore;
import com.vn.aitutor.service.quiz.QuestionBankService;
import jakarta.persistence.EntityManagerFactory;
import java.time.Clock;
import java.util.*;
import java.util.concurrent.*;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.*;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.*;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import tools.jackson.databind.json.JsonMapper;

/** Real producer transactions and locks, real notification/delivery inserts; AI alone is simulated. */
@Testcontainers(disabledWithoutDocker = true)
@SpringJUnitConfig(QuizNotificationIntegrationTest.Config.class)
class QuizNotificationIntegrationTest {
    @Container static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(
            DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres"));
    @Autowired JdbcTemplate jdbc;
    @Autowired QuizGenerationConsumer consumer;
    @Autowired GenerationJobStore jobs;
    @Autowired QuestionGeneratorAgent agent;
    @Autowired com.vn.aitutor.config.NotificationDeliveryJob deliveryJob;
    @Autowired NotificationDeliverySender sender;
    UUID owner, quiz;

    @BeforeEach void setup() {
        jdbc.execute("DROP TRIGGER IF EXISTS fail_quiz_notification ON notification_deliveries");
        jdbc.execute("TRUNCATE ai_generation_jobs, quizzes, notifications CASCADE");
        reset(agent);
        reset(sender);
        owner = user("STUDENT");
        quiz = quiz(owner);
        var question = new QuestionBankCreateRequest();
        question.setStem("1 + 1 = ?"); question.setExplanation("Cộng hai số một.");
        question.setType(QuestionType.MULTIPLE_CHOICE); question.setChoices(List.of("2", "3")); question.setCorrectAnswer("2");
        var response = new QuestionBankListResponse(); response.setQuestions(List.of(question));
        when(agent.generateQuestions(any(), any(), any(), anyInt(), anyInt())).thenReturn(response);
    }

    @Test void studentSuccessIsAtomicAndRedeliveryDoesNotRegenerateOrDuplicate() {
        consumer.handleQuizGeneration(message());
        consumer.handleQuizGeneration(message());
        assertEquals("READY", quizStatus());
        assertEquals(1, count("quiz_questions"));
        assertNotification(owner, "QUIZ_GENERATED", "QUIZ", "/student/practice/MATH");
        verify(agent, times(1)).generateQuestions(any(), any(), any(), anyInt(), anyInt());
    }

    @Test void finalStudentFailureIsDurableAndRedeliveryIsIdempotent() {
        var empty = new QuestionBankListResponse(); empty.setQuestions(List.of());
        when(agent.generateQuestions(any(), any(), any(), anyInt(), anyInt())).thenReturn(empty);
        consumer.handleQuizGeneration(message());
        consumer.handleQuizGeneration(message());
        assertEquals("FAILED", quizStatus()); assertEquals(0, count("quiz_questions"));
        assertNotification(owner, "QUIZ_GENERATION_FAILED", "QUIZ", "/student/practice/MATH");
        verify(agent, times(1)).generateQuestions(any(), any(), any(), anyInt(), anyInt());
    }

    @Test void studentNotificationInsertFailureRollsBackQuestionsAndStatusAndCanBeRedelivered() {
        failDeliveryInsert();
        assertThrows(RuntimeException.class, () -> consumer.handleQuizGeneration(message()));
        assertEquals("GENERATING", quizStatus());
        assertEquals(0, count("quiz_questions")); assertEquals(0, count("notifications"));
        jdbc.execute("DROP TRIGGER fail_quiz_notification ON notification_deliveries");
        consumer.handleQuizGeneration(message());
        assertEquals("READY", quizStatus()); assertEquals(1, count("quiz_questions"));
        assertNotification(owner, "QUIZ_GENERATED", "QUIZ", "/student/practice/MATH");
    }

    @Test void failedStudentNotificationInsertAlsoRollsBackFinalFailure() {
        var empty = new QuestionBankListResponse(); empty.setQuestions(List.of());
        when(agent.generateQuestions(any(), any(), any(), anyInt(), anyInt())).thenReturn(empty);
        failDeliveryInsert();
        assertThrows(RuntimeException.class, () -> consumer.handleQuizGeneration(message()));
        assertEquals("GENERATING", quizStatus()); assertEquals(0, count("notifications"));
        jdbc.execute("DROP TRIGGER fail_quiz_notification ON notification_deliveries");
        consumer.handleQuizGeneration(message());
        assertEquals("FAILED", quizStatus()); assertEquals(1, count("notifications"));
    }

    @Test void teacherSuccessGoesToRequesterRatherThanQuizCreatorAndAcknowledgementIsUnchanged() {
        UUID teacher = user("TEACHER"), job = job(teacher, "QUIZ");
        jobs.markDone(job, null, null); jobs.markDone(job, null, null); jobs.markFailed(job, "late failure");
        assertEquals("DONE", jobStatus(job));
        assertNotification(teacher, "QUIZ_GENERATED", "GENERATION_JOB", "/teacher/quizzes/" + quiz);
        assertEquals("ACKNOWLEDGED", jobs.acknowledge(job, teacher).getStatus());
        jobs.markDone(job, null, null);
        assertEquals(1, count("notifications"));
    }

    @Test void adminFailureAndRecoveryEmitOnlyQuizNotifications() {
        UUID admin = user("ADMIN"), failed = job(admin, "QUIZ");
        jobs.markFailed(failed, "AI unavailable"); jobs.markFailed(failed, "repeat");
        assertNotification(admin, "QUIZ_GENERATION_FAILED", "GENERATION_JOB", "/admin/quizzes/" + quiz);
        UUID interrupted = job(admin, "QUIZ");
        UUID bank = job(admin, "BANK");
        assertEquals(2, jobs.failInterrupted()); assertEquals(0, jobs.failInterrupted());
        assertEquals("FAILED", jobStatus(interrupted)); assertEquals("FAILED", jobStatus(bank));
        assertEquals(2, count("notifications")); assertEquals(2, count("notification_deliveries"));
    }

    @Test void jobNotificationInsertFailureRollsBackDoneAndRecovery() {
        UUID teacher = user("TEACHER"), job = job(teacher, "QUIZ");
        failDeliveryInsert();
        assertThrows(RuntimeException.class, () -> jobs.markDone(job, null, null));
        assertEquals("RUNNING", jobStatus(job)); assertEquals(0, count("notifications"));
        assertThrows(RuntimeException.class, () -> jobs.markFailed(job, "AI failed"));
        assertEquals("RUNNING", jobStatus(job)); assertEquals(0, count("notifications"));
        assertThrows(RuntimeException.class, () -> jobs.failInterrupted());
        assertEquals("RUNNING", jobStatus(job)); assertEquals(0, count("notifications"));
        jdbc.execute("DROP TRIGGER fail_quiz_notification ON notification_deliveries");
        jobs.markDone(job, null, null);
        assertEquals("DONE", jobStatus(job)); assertEquals(1, count("notifications"));
    }

    @Test void concurrentStudentDeliveriesDoNotDuplicateQuestionsOrNotification() throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(() -> consumer.handleQuizGeneration(message()));
            var second = executor.submit(() -> consumer.handleQuizGeneration(message()));
            first.get(20, TimeUnit.SECONDS); second.get(20, TimeUnit.SECONDS);
        } finally { executor.shutdownNow(); }
        assertEquals("READY", quizStatus()); assertEquals(1, count("quiz_questions"));
        assertNotification(owner, "QUIZ_GENERATED", "QUIZ", "/student/practice/MATH");
    }

    @Test void brokerFailureRetriesDeliveryWithoutChangingTheSuccessfulQuiz() {
        consumer.handleQuizGeneration(message());
        doThrow(new IllegalStateException("broker unavailable")).when(sender).send(any());
        deliveryJob.deliverPending();
        assertEquals("READY", quizStatus()); assertEquals(1, count("notifications"));
        var delivery = jdbc.queryForMap("SELECT status, attempt_count, last_error_code FROM notification_deliveries");
        assertEquals("PENDING", delivery.get("status")); assertEquals(1, delivery.get("attempt_count"));
        assertEquals("BROKER_SEND_FAILED", delivery.get("last_error_code"));
    }

    @Test void bankCompletionDoesNotCreateQuizNotification() {
        UUID teacher = user("TEACHER"), bank = job(teacher, "BANK");
        jobs.markDone(bank, null, null);
        assertEquals("DONE", jobStatus(bank)); assertEquals(0, count("notifications"));
    }

    @Test void concurrentJobOutcomesProduceOneTerminalResultAndOneNotification() throws Exception {
        UUID teacher = user("TEACHER"), job = job(teacher, "QUIZ");
        var executor = Executors.newFixedThreadPool(2);
        try {
            var done = executor.submit(() -> jobs.markDone(job, null, null));
            var failed = executor.submit(() -> jobs.markFailed(job, "AI unavailable"));
            done.get(20, TimeUnit.SECONDS); failed.get(20, TimeUnit.SECONDS);
        } finally { executor.shutdownNow(); }
        assertEquals(1, count("notifications")); assertEquals(1, count("notification_deliveries"));
        String type = jdbc.queryForObject("SELECT type FROM notifications", String.class);
        assertEquals(jobStatus(job).equals("DONE") ? "QUIZ_GENERATED" : "QUIZ_GENERATION_FAILED", type);
    }

    private UUID user(String role) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO users (id, username, email, password_hash, full_name, gender, role) VALUES (?, ?, ?, 'unused', 'T6 Test', 'OTHER', ?)",
                id, "t6-" + id, id + "@example.invalid", role);
        return id;
    }
    private UUID quiz(UUID creator) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO quizzes (id, title, subject, difficulty, created_by_id, generation_status, is_active) VALUES (?, 'T6', 'MATH', 'EASY', ?, 'GENERATING', FALSE)", id, creator);
        return id;
    }
    private UUID job(UUID requester, String kind) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO ai_generation_jobs (id, kind, status, requested_by_id, quiz_id) VALUES (?, ?, 'RUNNING', ?, ?)", id, kind, requester, kind.equals("QUIZ") ? quiz : null);
        return id;
    }
    private QuizGenerationMessage message() { return QuizGenerationMessage.builder().quizId(quiz).subject("MATH").gradeLevel("5").count(1).difficulty(1).build(); }
    private String quizStatus() { return jdbc.queryForObject("SELECT generation_status FROM quizzes WHERE id = ?", String.class, quiz); }
    private String jobStatus(UUID id) { return jdbc.queryForObject("SELECT status FROM ai_generation_jobs WHERE id = ?", String.class, id); }
    private int count(String table) { return jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class); }
    private void assertNotification(UUID recipient, String type, String source, String link) {
        var row = jdbc.queryForMap("SELECT user_id, type, source_type, link, metadata->>'quizId' AS quiz_id FROM notifications");
        assertEquals(recipient, row.get("user_id")); assertEquals(type, row.get("type"));
        assertEquals(source, row.get("source_type")); assertEquals(link, row.get("link")); assertEquals(quiz.toString(), row.get("quiz_id"));
        assertEquals(1, count("notification_deliveries"));
        assertEquals("WEBSOCKET", jdbc.queryForObject("SELECT channel FROM notification_deliveries", String.class));
    }
    private void failDeliveryInsert() {
        jdbc.execute("CREATE OR REPLACE FUNCTION reject_quiz_delivery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated notification insert failure'; END $$");
        jdbc.execute("CREATE TRIGGER fail_quiz_notification BEFORE INSERT ON notification_deliveries FOR EACH ROW EXECUTE FUNCTION reject_quiz_delivery()");
    }

    @Configuration @EnableTransactionManagement
    static class Config {
        @Bean DataSource dataSource() { return new DriverManagerDataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword()); }
        @Bean Flyway flyway(DataSource dataSource) { var flyway = Flyway.configure().dataSource(dataSource).load(); flyway.migrate(); return flyway; }
        @Bean @DependsOn("flyway") LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            var factory = new LocalContainerEntityManagerFactoryBean(); factory.setDataSource(dataSource);
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter()); factory.setPackagesToScan("com.vn.aitutor.entity");
            factory.setJpaPropertyMap(Map.of("hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl"));
            return factory;
        }
        @Bean PlatformTransactionManager transactionManager(EntityManagerFactory factory, DataSource dataSource) { var tx = new JpaTransactionManager(factory); tx.setDataSource(dataSource); return tx; }
        @Bean JdbcTemplate jdbc(DataSource dataSource) { return new JdbcTemplate(dataSource); }
        private <T> T repository(Class<T> type, EntityManagerFactory factory) { return new JpaRepositoryFactory(SharedEntityManagerCreator.createSharedEntityManager(factory)).getRepository(type); }
        @Bean QuizRepository quizzes(EntityManagerFactory factory) { return repository(QuizRepository.class, factory); }
        @Bean QuizQuestionRepository questions(EntityManagerFactory factory) { return repository(QuizQuestionRepository.class, factory); }
        @Bean AiGenerationJobRepository jobs(EntityManagerFactory factory) { return repository(AiGenerationJobRepository.class, factory); }
        @Bean QuestionGeneratorAgent agent() { return mock(QuestionGeneratorAgent.class); }
        @Bean NotificationCreationService notifications(JdbcTemplate jdbc) { return new NotificationCreationService(jdbc, JsonMapper.builder().build(), Clock.systemUTC()); }
        @Bean NotificationDeliveryStore deliveries(JdbcTemplate jdbc) { return new NotificationDeliveryStore(jdbc, JsonMapper.builder().build(), Clock.systemUTC()); }
        @Bean NotificationDeliverySender sender() { return mock(NotificationDeliverySender.class); }
        @Bean io.micrometer.core.instrument.simple.SimpleMeterRegistry meterRegistry() { return new io.micrometer.core.instrument.simple.SimpleMeterRegistry(); }
        @Bean NotificationDeliveryMetrics deliveryMetrics(io.micrometer.core.instrument.MeterRegistry registry) {
            return new NotificationDeliveryMetrics(registry, Clock.systemUTC());
        }
        @Bean com.vn.aitutor.config.NotificationDeliveryJob deliveryJob(NotificationDeliveryStore store,
                NotificationDeliverySender sender, NotificationDeliveryMetrics metrics) {
            return new com.vn.aitutor.config.NotificationDeliveryJob(store, sender, metrics);
        }
        @Bean QuizGenerationConsumer consumer(QuizRepository quizzes, QuizQuestionRepository questions, QuestionGeneratorAgent agent, NotificationCreationService notifications, PlatformTransactionManager tx) {
            return new QuizGenerationConsumer(quizzes, questions, mock(QuestionBankRepository.class), agent, notifications, new TransactionTemplate(tx));
        }
        @Bean GenerationJobStore store(AiGenerationJobRepository jobs, QuizRepository quizzes, NotificationCreationService notifications) {
            return new GenerationJobStore(jobs, mock(UserRepository.class), mock(LessonRepository.class), quizzes, mock(QuestionBankService.class), notifications);
        }
    }
}
