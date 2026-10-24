package com.vn.aitutor.service.system.notification;

import static org.junit.jupiter.api.Assertions.*;

import com.vn.aitutor.entity.Notification;
import com.vn.aitutor.entity.NotificationDelivery;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.NotificationChannel;
import com.vn.aitutor.service.system.NotificationService;
import com.vn.aitutor.config.NotificationDeliveryJob;
import com.vn.aitutor.config.ScheduleNotificationJob;
import com.vn.aitutor.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.persistenceunit.PersistenceManagedTypes;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

/** Isolated database: exercises actual Flyway SQL, JPA mappings and PostgreSQL conflict semantics. */
@Testcontainers(disabledWithoutDocker = true)
@SpringJUnitConfig(NotificationPersistenceIntegrationTest.Config.class)
class NotificationPersistenceIntegrationTest {
    private static final UUID LEGACY_ID = UUID.fromString("b13f2a82-dbe0-49d2-a8c6-6fb710255a44");
    private static final String ADMIN_ID = "3e9e5975-4fad-4226-8533-3ac9f573155d";
    private static final Instant NOW = Instant.parse("2026-10-21T00:00:00Z");

    @Container static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(
            DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres"));

    @Autowired NotificationCreationService service;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired EntityManagerFactory entityManagerFactory;
    @PersistenceContext EntityManager entityManager;
    @Autowired NotificationService queries;
    @Autowired NotificationDeliveryStore deliveries;
    @Autowired ClassReminderService reminders;
    @Autowired NotificationDeliveryJob deliveryJob;
    @Autowired ScheduleNotificationJob reminderJob;
    @Autowired NotificationDeliverySender sender;
    @Autowired MutableClock clock;
    UUID userId;

    @BeforeEach void createUser() {
        clock.set(NOW);
        org.mockito.Mockito.reset(sender);
        userId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, username, email, password_hash, full_name, gender, role)
                VALUES (?, ?, ?, 'unused', 'Notification Test', 'OTHER', 'STUDENT')
                """, userId, "notification-" + userId, userId + "@example.invalid");
    }

    @AfterEach void removeUser() {
        jdbc.update("DELETE FROM users WHERE id = ?", userId);
    }

    @Test void migratesExistingRowsWithoutInventingDeliveries() {
        var entityManager = entityManagerFactory.createEntityManager();
        try {
            Notification legacy = entityManager.find(Notification.class, LEGACY_ID);
            var dto = com.vn.aitutor.dto.response.notification.NotificationResponse.from(legacy);
            assertEquals("LEGACY_TYPE", dto.type());
            assertTrue(dto.isRead());
            assertEquals(java.util.Map.of(), dto.metadata());
            assertNull(legacy.getEventKey());
            assertEquals(0, deliveryCount(LEGACY_ID));
            assertEquals(5, jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE success", Integer.class));
        } finally { entityManager.close(); }
    }

    @Test void migrationAcceptsStudyClassSourceAndPreservesLegacyRows() {
        UUID classId = UUID.randomUUID();
        UUID enrollmentId = UUID.randomUUID();
        Instant requestedAt = Instant.parse("2026-10-24T08:15:30Z");
        var command = NotificationCommands.studyClassJoinResult(userId, classId, enrollmentId,
                "Lớp Toán 5A", EnrollmentStatus.APPROVED, requestedAt);

        var created = service.create(command);

        assertTrue(created.created());
        assertEquals("STUDY_CLASS_ENROLLMENT", jdbc.queryForObject(
                "SELECT source_type FROM notifications WHERE id = ?", String.class, created.notification().id()));
        assertEquals(requestedAt, jdbc.queryForObject(
                "SELECT occurrence_at FROM notifications WHERE id = ?", java.sql.Timestamp.class,
                created.notification().id()).toInstant());
        assertEquals(1, deliveryCount(created.notification().id()));
        assertEquals("LEGACY_TYPE", jdbc.queryForObject(
                "SELECT type FROM notifications WHERE id = ?", String.class, LEGACY_ID));
    }

    @Test void persistsReminderAndBothDeliveriesWithJpaCompatibleMappings() {
        var command = reminder();
        var result = service.create(command);
        assertTrue(result.created());
        assertFalse(result.notification().isRead());
        assertEquals(NOW, result.notification().createdAt());
        assertEquals(command.metadata(), result.notification().metadata());
        assertEquals(2, deliveryCount(result.notification().id()));
        assertEquals(Set.of("EMAIL", "WEBSOCKET"), Set.copyOf(jdbc.queryForList(
                "SELECT channel FROM notification_deliveries WHERE notification_id = ?", String.class, result.notification().id())));
        var entityManager = entityManagerFactory.createEntityManager();
        try {
            var saved = entityManager.find(Notification.class, result.notification().id());
            assertEquals(command.eventKey(), saved.getEventKey());
            assertEquals(command.metadata(), saved.getMetadata());
            var deliveries = entityManager.createQuery("FROM NotificationDelivery d WHERE d.notification.id = :id", NotificationDelivery.class)
                    .setParameter("id", saved.getId()).getResultList();
            assertEquals(2, deliveries.size());
            assertTrue(deliveries.stream().allMatch(d -> d.getAttemptCount() == 0
                    && d.getExpiresAt().equals(command.expiresAt()) && d.getLeaseToken() == null));
        } finally { entityManager.close(); }
    }

    @Test void deliveryMetricsSnapshotCountsCurrentStatesAndOldestPendingAge() {
        UUID notificationId = service.create(reminder()).notification().id();
        clock.set(NOW.plusSeconds(30));

        var initial = deliveries.metricsSnapshot();
        assertEquals(2, initial.pending());
        assertEquals(0, initial.failed());
        assertEquals(30.0, initial.oldestPendingSeconds(), 0.001);

        jdbc.update("""
                UPDATE notification_deliveries SET status = 'FAILED', attempt_count = 5,
                    last_error_code = 'TEST_FAILURE', updated_at = ?
                WHERE id = (SELECT id FROM notification_deliveries
                    WHERE notification_id = ? ORDER BY id LIMIT 1)
                """, java.sql.Timestamp.from(clock.instant()), notificationId);
        var afterFailure = deliveries.metricsSnapshot();
        assertEquals(1, afterFailure.pending());
        assertEquals(1, afterFailure.failed());
        assertEquals(30.0, afterFailure.oldestPendingSeconds(), 0.001);
    }

    @Test void quizCreatesOnlyWebsocketAndPreservesFirstPayloadOnReplay() {
        var command = NotificationCommands.quizResult(userId, Role.STUDENT, UUID.randomUUID(), null, "MATH", true);
        var original = service.create(command);
        jdbc.update("UPDATE notification_deliveries SET status = 'FAILED', attempt_count = 5, last_error_code = 'BROKER_UNAVAILABLE' WHERE notification_id = ?",
                original.notification().id());
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
            var duplicate = service.create(command);
            assertFalse(duplicate.created());
            assertEquals(original.notification(), duplicate.notification());
            // A duplicate must not poison the caller's transaction or reset failed delivery state.
            jdbc.update("UPDATE users SET full_name = 'Replay committed' WHERE id = ?", userId);
        });
        assertEquals(1, notificationCount());
        assertEquals(1, deliveryCount(original.notification().id()));
        assertEquals("FAILED", jdbc.queryForObject("SELECT status FROM notification_deliveries WHERE notification_id = ?", String.class, original.notification().id()));
        assertEquals("Replay committed", jdbc.queryForObject("SELECT full_name FROM users WHERE id = ?", String.class, userId));
    }

    @Test void callerRollbackRemovesNotificationDeliveriesAndBusinessChange() {
        assertThrows(IllegalStateException.class, () -> new TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
            entityManager.find(User.class, userId).setFullName("Must roll back");
            entityManager.flush();
            service.create(reminder());
            throw new IllegalStateException("Business operation failed");
        }));
        assertEquals(0, notificationCount());
        assertEquals(0, userDeliveryCount());
        assertEquals("Notification Test", jdbc.queryForObject("SELECT full_name FROM users WHERE id = ?", String.class, userId));
    }

    @Test void commitsJpaBusinessChangesAndJdbcNotificationsTogether() {
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
            entityManager.find(User.class, userId).setFullName("Business committed");
            service.create(reminder());
        });
        assertEquals("Business committed", jdbc.queryForObject("SELECT full_name FROM users WHERE id = ?", String.class, userId));
        assertEquals(1, notificationCount());
        assertEquals(2, userDeliveryCount());
    }

    @Test void deliveryInsertFailureRollsBackTheNotification() {
        jdbc.execute("""
                CREATE FUNCTION reject_test_delivery() RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN RAISE EXCEPTION 'Simulated delivery insert failure'; END $$
                """);
        jdbc.execute("CREATE TRIGGER reject_test_delivery BEFORE INSERT ON notification_deliveries FOR EACH ROW EXECUTE FUNCTION reject_test_delivery()");
        try {
            assertThrows(org.springframework.dao.DataAccessException.class, () -> service.create(reminder()));
            assertEquals(0, notificationCount());
            assertEquals(0, userDeliveryCount());
        } finally {
            jdbc.execute("DROP TRIGGER reject_test_delivery ON notification_deliveries");
            jdbc.execute("DROP FUNCTION reject_test_delivery()");
        }
    }

    @Test void concurrentTransactionsCreateOneNotificationAndOneDeliveryPerChannel() throws Exception {
        var command = reminder();
        ExecutorService executor = Executors.newFixedThreadPool(6);
        CyclicBarrier barrier = new CyclicBarrier(6);
        try {
            List<Callable<NotificationCreationResult>> calls = java.util.Collections.nCopies(6, () -> {
                barrier.await(10, TimeUnit.SECONDS);
                return service.create(command);
            });
            var futures = executor.invokeAll(calls, 30, TimeUnit.SECONDS);
            Set<UUID> ids = new java.util.HashSet<>();
            int created = 0;
            for (var future : futures) {
                var result = future.get(5, TimeUnit.SECONDS);
                ids.add(result.notification().id());
                if (result.created()) created++;
            }
            assertEquals(1, created);
            assertEquals(1, ids.size());
            assertEquals(1, notificationCount());
            assertEquals(2, deliveryCount(ids.iterator().next()));
        } finally { executor.shutdownNow(); }
    }

    @Test void sameEventKeyCanBeDeliveredToDifferentRecipients() {
        var command = reminder();
        var first = service.create(command);
        var other = new NotificationCommand(UUID.fromString(ADMIN_ID), command.type(), command.eventKey(),
                command.sourceType(), command.sourceId(), command.occurrenceAt(), command.title(), command.message(),
                command.link(), command.metadata(), command.channels(), command.expiresAt());
        var second = service.create(other);
        try {
            assertTrue(second.created());
            assertNotEquals(first.notification().id(), second.notification().id());
        } finally { jdbc.update("DELETE FROM notifications WHERE id = ?", second.notification().id()); }
    }

    @Test void constraintsProtectDeliveryUniquenessStateAndCascade() {
        var result = service.create(reminder());
        UUID id = result.notification().id();
        assertThrows(org.springframework.dao.DataAccessException.class, () -> jdbc.update("""
                INSERT INTO notification_deliveries (id, notification_id, channel) VALUES (?, ?, 'EMAIL')
                """, UUID.randomUUID(), id));
        assertThrows(org.springframework.dao.DataAccessException.class, () -> jdbc.update(
                "UPDATE notification_deliveries SET attempt_count = -1 WHERE notification_id = ?", id));
        assertThrows(org.springframework.dao.DataAccessException.class, () -> jdbc.update(
                "UPDATE notification_deliveries SET status = 'PROCESSING' WHERE notification_id = ?", id));
        assertThrows(org.springframework.dao.DataAccessException.class, () -> jdbc.update(
                "UPDATE notification_deliveries SET status = 'SENT' WHERE notification_id = ?", id));
        jdbc.update("DELETE FROM notifications WHERE id = ?", id);
        assertEquals(0, deliveryCount(id));
    }

    @Test void feedUsesStableCursorForEqualTimestampsAndCountsUnreadBeyondPage() {
        for (int i = 0; i < 25; i++) createQuiz();
        var first = queries.getFeed(userId, null, 7, false);
        assertEquals(7, first.items().size());
        assertEquals(25, first.unreadCount());
        assertNotNull(first.nextCursor());
        Set<UUID> seen = new java.util.HashSet<>();
        first.items().forEach(n -> assertTrue(seen.add(n.id())));
        String cursor = first.nextCursor();
        // New notifications must not shift the continuation through the original page boundary.
        clock.set(NOW.plusSeconds(1));
        var later = createQuiz();
        while (cursor != null) {
            var page = queries.getFeed(userId, cursor, 7, false);
            assertEquals(26, page.unreadCount());
            for (var n : page.items()) assertTrue(seen.add(n.id()));
            cursor = page.nextCursor();
        }
        assertEquals(25, seen.size());
        assertFalse(seen.contains(later.notification().id()));
        assertEquals(20, queries.getMyNotifications(userId, null).size());
    }

    @Test void legacyAndFeedAreBoundedAtOneHundredAndCanFilterUnread() {
        jdbc.update("""
                INSERT INTO notifications (id, user_id, title, message, type)
                SELECT gen_random_uuid(), ?, 'Title', 'Message', 'LEGACY_TYPE' FROM generate_series(1, 105)
                """, userId);
        assertEquals(100, queries.getMyNotifications(userId, Integer.MAX_VALUE).size());
        assertEquals(20, queries.getMyNotifications(userId, -1).size());
        var page = queries.getFeed(userId, null, Integer.MAX_VALUE, false);
        assertEquals(100, page.items().size());
        assertNotNull(page.nextCursor());
        queries.markAsRead(page.items().get(0).id(), userId);
        var unread = queries.getFeed(userId, null, 100, true);
        assertEquals(104, unread.unreadCount());
        assertTrue(unread.items().stream().noneMatch(com.vn.aitutor.dto.response.notification.NotificationResponse::isRead));
    }

    @Test void httpFeedCountReadAndErrorsFollowApiContract() throws Exception {
        UUID id = createQuiz().notification().id();
        var mvc = notificationMvc(userId);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/notifications/feed").param("size", "1"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.items[0].id").value(id.toString()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.items[0].isRead").value(false))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.unreadCount").value(1));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/notifications/unread-count"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.data.unreadCount").value(1));
        notificationMvc(UUID.fromString(ADMIN_ID)).perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/notifications/" + id + "/read"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isNotFound());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/notifications/" + id + "/read"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/notifications/" + id + "/read"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/notifications/feed").param("cursor", "invalid"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/notifications/feed").param("size", "0"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isBadRequest());
    }

    @Test void readMutationsAreIdempotentAndCannotAffectAnotherUser() {
        UUID id = createQuiz().notification().id();
        UUID other = UUID.fromString(ADMIN_ID);
        assertThrows(ResourceNotFoundException.class, () -> queries.markAsRead(id, other));
        assertThrows(ResourceNotFoundException.class, () -> queries.markAsRead(UUID.randomUUID(), userId));
        assertEquals(1, queries.getUnreadCount(userId));
        queries.markAsRead(id, userId);
        queries.markAsRead(id, userId);
        assertEquals(0, queries.getUnreadCount(userId));
        createQuiz();
        queries.markAllAsRead(other);
        assertEquals(1, queries.getUnreadCount(userId));
        assertTrue(queries.getFeed(other, null, 100, false).items().stream().noneMatch(n -> n.id().equals(id)));
        queries.markAllAsRead(userId);
        assertEquals(0, queries.getUnreadCount(userId));
    }

    @Test void workerSendsAfterCommitWithoutAnActiveTransactionAndDoesNotReplaySent() {
        createQuiz();
        org.mockito.Mockito.doAnswer(invocation -> {
            assertFalse(org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive());
            PreparedDelivery delivery = invocation.getArgument(0);
            assertEquals("PROCESSING", status(delivery.claim().id()));
            assertEquals(1, notificationCount());
            return null;
        }).when(sender).send(org.mockito.ArgumentMatchers.any());
        deliveryJob.deliverPending();
        assertEquals(List.of("SENT"), jdbc.queryForList("SELECT status FROM notification_deliveries WHERE notification_id IN (SELECT id FROM notifications WHERE user_id = ?)", String.class, userId));
        deliveryJob.deliverPending();
        org.mockito.Mockito.verify(sender, org.mockito.Mockito.times(1)).send(org.mockito.ArgumentMatchers.any());
    }

    @Test void retriesFollowAllFourDelaysAndStopAfterFiveAttempts() {
        createQuiz();
        org.mockito.Mockito.doThrow(new IllegalStateException("broker down")).when(sender).send(org.mockito.ArgumentMatchers.any());
        int[] delays = {60, 300, 900, 3600};
        for (int attempt = 1; attempt <= 5; attempt++) {
            Instant before = clock.instant();
            deliveryJob.deliverPending();
            var state = jdbc.queryForMap("SELECT status, attempt_count, next_attempt_at FROM notification_deliveries WHERE notification_id IN (SELECT id FROM notifications WHERE user_id = ?)", userId);
            assertEquals(attempt, ((Number) state.get("attempt_count")).intValue());
            if (attempt < 5) {
                assertEquals("PENDING", state.get("status"));
                assertEquals(before.plusSeconds(delays[attempt - 1]), ((java.sql.Timestamp) state.get("next_attempt_at")).toInstant());
                deliveryJob.deliverPending(); // Not due yet; must not consume an attempt.
                clock.set(before.plusSeconds(delays[attempt - 1]));
            } else assertEquals("FAILED", state.get("status"));
        }
        clock.set(clock.instant().plusSeconds(7200));
        deliveryJob.deliverPending();
        org.mockito.Mockito.verify(sender, org.mockito.Mockito.times(5)).send(org.mockito.ArgumentMatchers.any());
        assertEquals(1, notificationCount());
    }

    @Test void restartRecoversLeaseAndOldOwnerCannotRecordItsOutcome() {
        createQuiz();
        DeliveryClaim old = deliveries.claimNext().orElseThrow();
        assertTrue(deliveries.claimNext().isEmpty());
        clock.set(NOW.plusSeconds(121));
        DeliveryClaim recovered = deliveries.claimNext().orElseThrow();
        assertEquals(old.id(), recovered.id());
        assertNotEquals(old.leaseToken(), recovered.leaseToken());
        assertEquals(2, recovered.attemptCount());
        assertFalse(deliveries.sent(old));
        assertFalse(deliveries.failed(old, "STALE_OWNER"));
        assertTrue(deliveries.prepare(old).isEmpty());
        assertTrue(deliveries.sent(recovered));
        assertEquals("SENT", status(old.id()));
    }

    @Test void finalAttemptCrashIsTerminalAfterLeaseExpires() {
        createQuiz();
        jdbc.update("UPDATE notification_deliveries SET attempt_count = 4 WHERE notification_id IN (SELECT id FROM notifications WHERE user_id = ?)", userId);
        var last = deliveries.claimNext().orElseThrow();
        assertEquals(5, last.attemptCount());
        clock.set(NOW.plusSeconds(121));
        deliveries.reconcile(100);
        assertEquals("FAILED", status(last.id()));
        assertTrue(deliveries.claimNext().isEmpty());
    }

    @Test void twoWorkersDeliverEachClaimOnlyOnce() throws Exception {
        for (int i = 0; i < 12; i++) createQuiz();
        var delivered = new java.util.concurrent.ConcurrentHashMap<UUID, java.util.concurrent.atomic.AtomicInteger>();
        org.mockito.Mockito.doAnswer(invocation -> {
            assertFalse(org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive());
            PreparedDelivery delivery = invocation.getArgument(0);
            delivered.computeIfAbsent(delivery.claim().id(), key -> new java.util.concurrent.atomic.AtomicInteger()).incrementAndGet();
            return null;
        }).when(sender).send(org.mockito.ArgumentMatchers.any());
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            var one = executor.submit(() -> deliveryJob.deliverPending());
            var two = executor.submit(() -> deliveryJob.deliverPending());
            one.get(20, TimeUnit.SECONDS);
            two.get(20, TimeUnit.SECONDS);
        } finally { executor.shutdownNow(); }
        assertEquals(12, delivered.size());
        assertTrue(delivered.values().stream().allMatch(count -> count.get() == 1));
        assertEquals(12, jdbc.queryForObject("SELECT count(*) FROM notification_deliveries d JOIN notifications n ON n.id = d.notification_id WHERE n.user_id = ? AND d.status = 'SENT'", Integer.class, userId));
    }

    @Test void skipLockedAllowsAnotherWorkerToClaimAnUnlockedRow() throws Exception {
        UUID first = createQuiz().notification().id();
        UUID second = createQuiz().notification().id();
        ExecutorService executor = Executors.newSingleThreadExecutor();
        CountDownLatch locked = new CountDownLatch(1), release = new CountDownLatch(1);
        var lock = executor.submit(() -> new TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
            jdbc.queryForList("SELECT id FROM notification_deliveries WHERE notification_id = ? FOR UPDATE", first);
            locked.countDown();
            try { assertTrue(release.await(10, TimeUnit.SECONDS)); }
            catch (InterruptedException ex) { throw new RuntimeException(ex); }
        }));
        try {
            assertTrue(locked.await(10, TimeUnit.SECONDS));
            var claimed = deliveries.claimNext().orElseThrow();
            assertEquals(second, claimed.notificationId());
            assertTrue(deliveries.sent(claimed));
        } finally {
            release.countDown();
            lock.get(10, TimeUnit.SECONDS);
            executor.shutdownNow();
        }
    }

    @Test void smtpFailureDoesNotBlockWebsocketAndRetriesOnlyFailedChannel() {
        addSlot(clock.instant().plusSeconds(600));
        reminderJob.scanAndSendNotifications();
        org.mockito.Mockito.doAnswer(invocation -> {
            PreparedDelivery delivery = invocation.getArgument(0);
            if (delivery.claim().channel() == NotificationChannel.EMAIL) throw new IllegalStateException("SMTP down");
            return null;
        }).when(sender).send(org.mockito.ArgumentMatchers.any());
        deliveryJob.deliverPending();
        assertEquals("SENT", channelStatus("WEBSOCKET"));
        assertEquals("PENDING", channelStatus("EMAIL"));
        org.mockito.Mockito.reset(sender);
        clock.set(clock.instant().plusSeconds(60));
        deliveryJob.deliverPending();
        assertEquals("SENT", channelStatus("EMAIL"));
        org.mockito.Mockito.verify(sender, org.mockito.Mockito.times(1)).send(org.mockito.ArgumentMatchers.argThat(d -> d.claim().channel() == NotificationChannel.EMAIL));
    }

    @Test void pendingReminderExpiresEvenIfRetryIsNotDueYet() {
        addSlot(NOW.plusSeconds(60));
        reminderJob.scanAndSendNotifications();
        jdbc.update("UPDATE notification_deliveries SET next_attempt_at = ? WHERE notification_id IN (SELECT id FROM notifications WHERE user_id = ?)", java.sql.Timestamp.from(NOW.plusSeconds(3600)), userId);
        clock.set(NOW.plusSeconds(60));
        deliveryJob.deliverPending();
        assertEquals("EXPIRED", channelStatus("EMAIL"));
        assertEquals("EXPIRED", channelStatus("WEBSOCKET"));
        org.mockito.Mockito.verifyNoInteractions(sender);
        assertEquals(1, notificationCount());
    }

    @Test void sourceChangedAfterClaimIsCancelledBeforeSend() {
        UUID slot = addSlot(NOW.plusSeconds(600));
        reminderJob.scanAndSendNotifications();
        var claim = deliveries.claimNext().orElseThrow();
        jdbc.update("UPDATE schedule_slots SET start_time = start_time + interval '1 minute' WHERE id = ?", slot);
        assertTrue(deliveries.prepare(claim).isEmpty());
        assertEquals("CANCELLED", status(claim.id()));
        deliveries.reconcile(100);
        assertEquals("CANCELLED", channelStatus("EMAIL"));
        assertEquals("CANCELLED", channelStatus("WEBSOCKET"));
        reminderJob.scanAndSendNotifications(); // Same slot/date must not recreate a cancelled reminder.
        assertEquals(1, notificationCount());
    }

    @Test void deletedSlotOrDisabledScheduleCancelsPendingDeliveries() {
        UUID slot = addSlot(NOW.plusSeconds(600));
        reminderJob.scanAndSendNotifications();
        jdbc.update("DELETE FROM schedule_slots WHERE id = ?", slot);
        deliveries.reconcile(100);
        assertEquals("CANCELLED", channelStatus("EMAIL"));
        assertEquals("CANCELLED", channelStatus("WEBSOCKET"));
    }

    @Test void disablingScheduleAfterCreationCancelsBothChannels() {
        addSlot(NOW.plusSeconds(600));
        reminderJob.scanAndSendNotifications();
        jdbc.update("UPDATE schedules SET is_active = FALSE WHERE student_id IN (SELECT id FROM students WHERE user_id = ?)", userId);
        deliveryJob.deliverPending();
        assertEquals("CANCELLED", channelStatus("EMAIL"));
        assertEquals("CANCELLED", channelStatus("WEBSOCKET"));
        org.mockito.Mockito.verifyNoInteractions(sender);
    }

    @Test void disablingPreferencesAfterCreationCancelsBothChannelsWithoutDeletingHistory() {
        addSlot(NOW.plusSeconds(600));
        reminderJob.scanAndSendNotifications();
        jdbc.update("UPDATE students SET study_preferences = '{\"studyReminderEnabled\":false}' WHERE user_id = ?", userId);
        deliveryJob.deliverPending();
        assertEquals("CANCELLED", channelStatus("EMAIL"));
        assertEquals("CANCELLED", channelStatus("WEBSOCKET"));
        assertEquals(1, notificationCount());
        org.mockito.Mockito.verifyNoInteractions(sender);
    }

    @Test void inactiveOrDeletedUsersReceiveNothing() {
        UUID id = createQuiz().notification().id();
        jdbc.update("UPDATE users SET is_active = FALSE WHERE id = ?", userId);
        deliveryJob.deliverPending();
        assertEquals("CANCELLED", jdbc.queryForObject("SELECT status FROM notification_deliveries WHERE notification_id = ?", String.class, id));
        org.mockito.Mockito.verifyNoInteractions(sender);
    }

    @Test void midnightSundayAndMondayAreScannedOnceIncludingExactWindowEnd() {
        Instant sunday = Instant.parse("2026-10-25T16:55:12Z");
        clock.set(sunday);
        addSlot(sunday.plusSeconds(60));
        addSlot(Instant.parse("2026-10-25T17:00:00Z"));
        addSlot(sunday.plusSeconds(900));
        addSlot(sunday.plusSeconds(901));
        addSlot(sunday); // Already starting; no reminder.
        reminderJob.scanAndSendNotifications();
        assertEquals(3, notificationCount());
        reminderJob.scanAndSendNotifications();
        assertEquals(3, notificationCount());
        assertEquals(6, userDeliveryCount());
    }

    @Test void missedScanCatchesUpButDoesNotNotifyAfterStart() {
        Instant start = NOW.plusSeconds(900);
        addSlot(start);
        clock.set(start.minusSeconds(20));
        reminderJob.scanAndSendNotifications();
        assertEquals(1, notificationCount());
        assertTrue(queries.getMyNotifications(userId, 20).get(0).message().contains("07:15"));
        assertFalse(queries.getMyNotifications(userId, 20).get(0).message().contains("15 phút"));
        clock.set(start);
        reminderJob.scanAndSendNotifications();
        deliveryJob.deliverPending();
        org.mockito.Mockito.verifyNoInteractions(sender);
    }

    @Test void preferenceAndScheduleEligibilityAreRecheckedBetweenScanAndCreation() {
        addSlot(NOW.plusSeconds(600));
        var date = NOW.atZone(NotificationCommands.REMINDER_ZONE).toLocalDate();
        var candidates = reminders.findCandidates(date, LocalTime.of(7, 0), LocalTime.of(7, 15), null, 100);
        assertEquals(1, candidates.size());
        jdbc.update("UPDATE schedules SET is_active = FALSE WHERE student_id IN (SELECT id FROM students WHERE user_id = ?)", userId);
        assertFalse(reminders.createIfEligible(candidates.get(0), date, NOW.plusSeconds(900)));
        reminderJob.scanAndSendNotifications();
        assertEquals(0, notificationCount());
    }

    @Test void disabledPreferencesAndInactiveUsersAreExcludedBeforeCreation() {
        addSlot(NOW.plusSeconds(600));
        jdbc.update("UPDATE students SET study_preferences = '{\"studyReminderEnabled\":false}' WHERE user_id = ?", userId);
        reminderJob.scanAndSendNotifications();
        assertEquals(0, notificationCount());
        jdbc.update("UPDATE students SET study_preferences = '{}' WHERE user_id = ?", userId);
        jdbc.update("UPDATE users SET is_deleted = TRUE WHERE id = ?", userId);
        reminderJob.scanAndSendNotifications();
        assertEquals(0, notificationCount());
    }

    @Test void scansMoreThanOneBatchAndConcurrentScansRemainIdempotent() throws Exception {
        UUID slot = addSlot(NOW.plusSeconds(600));
        jdbc.update("""
                INSERT INTO schedule_slots (id, schedule_id, subject_name, day_of_week, start_time, end_time)
                SELECT gen_random_uuid(), original.schedule_id, 'Toán', original.day_of_week, original.start_time, original.end_time
                FROM schedule_slots original CROSS JOIN generate_series(1, 104) WHERE original.id = ?
                """, slot);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(() -> reminderJob.scanAndSendNotifications());
            var second = executor.submit(() -> reminderJob.scanAndSendNotifications());
            first.get(30, TimeUnit.SECONDS);
            second.get(30, TimeUnit.SECONDS);
        } finally { executor.shutdownNow(); }
        assertEquals(105, notificationCount());
        assertEquals(210, userDeliveryCount());
    }

    private NotificationCreationResult createQuiz() {
        return service.create(NotificationCommands.quizResult(userId, Role.STUDENT, UUID.randomUUID(), null, "MATH", true));
    }
    private org.springframework.test.web.servlet.MockMvc notificationMvc(UUID ownerId) {
        var owner = new User();
        owner.setId(ownerId);
        var principal = com.vn.aitutor.security.principal.UserPrincipal.builder().users(owner).build();
        return org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup(
                new com.vn.aitutor.controller.NotificationController(queries))
                .setControllerAdvice(new com.vn.aitutor.exception.GlobalExceptionHandler())
                .setCustomArgumentResolvers(new org.springframework.web.method.support.HandlerMethodArgumentResolver() {
                    @Override public boolean supportsParameter(org.springframework.core.MethodParameter parameter) {
                        return parameter.getParameterType() == com.vn.aitutor.security.principal.UserPrincipal.class;
                    }
                    @Override public Object resolveArgument(org.springframework.core.MethodParameter parameter,
                            org.springframework.web.method.support.ModelAndViewContainer container,
                            org.springframework.web.context.request.NativeWebRequest request,
                            org.springframework.web.bind.support.WebDataBinderFactory binder) { return principal; }
                }).build();
    }
    private String status(UUID id) {
        return jdbc.queryForObject("SELECT status FROM notification_deliveries WHERE id = ?", String.class, id);
    }
    private String channelStatus(String channel) {
        return jdbc.queryForObject("SELECT d.status FROM notification_deliveries d JOIN notifications n ON n.id = d.notification_id WHERE n.user_id = ? AND d.channel = ?", String.class, userId, channel);
    }
    private UUID addSlot(Instant startsAt) {
        var students = jdbc.queryForList("SELECT id FROM students WHERE user_id = ?", UUID.class, userId);
        UUID studentId;
        if (students.isEmpty()) {
            studentId = UUID.randomUUID();
            jdbc.update("INSERT INTO students (id, user_id, student_code) VALUES (?, ?, ?)", studentId, userId, "N-" + studentId);
        } else studentId = students.get(0);
        var schedules = jdbc.queryForList("SELECT id FROM schedules WHERE student_id = ?", UUID.class, studentId);
        UUID scheduleId;
        if (schedules.isEmpty()) {
            scheduleId = UUID.randomUUID();
            jdbc.update("INSERT INTO schedules (id, student_id, name) VALUES (?, ?, 'Notification Test')", scheduleId, studentId);
        } else scheduleId = schedules.get(0);
        UUID slotId = UUID.randomUUID();
        var local = startsAt.atZone(NotificationCommands.REMINDER_ZONE);
        jdbc.update("INSERT INTO schedule_slots (id, schedule_id, subject_name, day_of_week, start_time, end_time, room) VALUES (?, ?, 'Toán', ?, ?, ?, 'A1')",
                slotId, scheduleId, local.getDayOfWeek().getValue() + 1, local.toLocalTime(), local.toLocalTime().plusMinutes(30));
        return slotId;
    }

    private NotificationCommand reminder() {
        return NotificationCommands.classReminder(userId, UUID.randomUUID(), UUID.randomUUID(),
                "Toán", NOW.plusSeconds(900), "Phòng 202");
    }
    private int notificationCount() {
        return jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id = ?", Integer.class, userId);
    }
    private int deliveryCount(UUID id) {
        return jdbc.queryForObject("SELECT count(*) FROM notification_deliveries WHERE notification_id = ?", Integer.class, id);
    }
    private int userDeliveryCount() {
        return jdbc.queryForObject("SELECT count(*) FROM notification_deliveries d JOIN notifications n ON n.id = d.notification_id WHERE n.user_id = ?", Integer.class, userId);
    }

    @Configuration
    @EnableTransactionManagement
    static class Config {
        @Bean DataSource dataSource() {
            return new DriverManagerDataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
        }
        @Bean Flyway flyway(DataSource dataSource) {
            // Seed a real V2 row before upgrading: verifies migration compatibility, not just a clean install.
            Flyway.configure().dataSource(dataSource).target("2").load().migrate();
            new JdbcTemplate(dataSource).update("""
                    INSERT INTO notifications (id, user_id, title, message, type, is_read)
                    VALUES (?, CAST(? AS uuid), 'Legacy', 'Existing notification', 'LEGACY_TYPE', TRUE)
                    """, LEGACY_ID, ADMIN_ID);
            Flyway flyway = Flyway.configure().dataSource(dataSource).load();
            flyway.migrate();
            return flyway;
        }
        @Bean @DependsOn("flyway") LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            var factory = new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(dataSource);
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setManagedTypes(PersistenceManagedTypes.of(Notification.class.getName(), User.class.getName(), NotificationDelivery.class.getName()));
            factory.setJpaPropertyMap(java.util.Map.of("hibernate.hbm2ddl.auto", "validate",
                    "hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl"));
            return factory;
        }
        @Bean PlatformTransactionManager transactionManager(EntityManagerFactory factory, DataSource dataSource) {
            var manager = new JpaTransactionManager(factory);
            manager.setDataSource(dataSource);
            return manager;
        }
        @Bean JdbcTemplate jdbcTemplate(DataSource dataSource) { return new JdbcTemplate(dataSource); }
        @Bean ObjectMapper objectMapper() { return JsonMapper.builder().build(); }
        @Bean MutableClock learningClock() { return new MutableClock(); }
        @Bean NotificationService queries(JdbcTemplate jdbc, ObjectMapper mapper) { return new NotificationService(jdbc, mapper); }
        @Bean NotificationDeliveryStore deliveries(JdbcTemplate jdbc, ObjectMapper mapper, Clock clock) { return new NotificationDeliveryStore(jdbc, mapper, clock); }
        @Bean ClassReminderService reminders(JdbcTemplate jdbc, NotificationCreationService service, Clock clock) { return new ClassReminderService(jdbc, service, clock); }
        @Bean NotificationDeliverySender sender() { return org.mockito.Mockito.mock(NotificationDeliverySender.class); }
        @Bean io.micrometer.core.instrument.simple.SimpleMeterRegistry meterRegistry() { return new io.micrometer.core.instrument.simple.SimpleMeterRegistry(); }
        @Bean NotificationDeliveryMetrics deliveryMetrics(io.micrometer.core.instrument.MeterRegistry registry, Clock clock) {
            return new NotificationDeliveryMetrics(registry, clock);
        }
        @Bean NotificationDeliveryJob deliveryJob(NotificationDeliveryStore store, NotificationDeliverySender sender,
                NotificationDeliveryMetrics metrics) { return new NotificationDeliveryJob(store, sender, metrics); }
        @Bean ScheduleNotificationJob reminderJob(ClassReminderService service, Clock clock) { return new ScheduleNotificationJob(service, clock); }
        @Bean NotificationCreationService creationService(JdbcTemplate jdbc, ObjectMapper mapper, Clock clock) {
            return new NotificationCreationService(jdbc, mapper, clock);
        }
    }

    static class MutableClock extends Clock {
        private volatile Instant instant = NOW;
        void set(Instant value) { instant = value; }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(instant, zone); }
        @Override public Instant instant() { return instant; }
    }
}
