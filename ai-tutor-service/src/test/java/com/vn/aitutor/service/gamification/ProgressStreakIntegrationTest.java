package com.vn.aitutor.service.gamification;

import com.vn.aitutor.service.quiz.StudentProgressService;
import com.vn.aitutor.service.quiz.QuizSubmissionService;
import com.vn.aitutor.service.user.IStudentProfileService;
import com.vn.aitutor.service.user.IAdminStudentService;
import com.vn.aitutor.config.StreakResetJob;
import com.vn.aitutor.dto.request.quiz.*;
import com.vn.aitutor.dto.response.quiz.StudentProgressResponse;
import com.vn.aitutor.entity.*;
import com.vn.aitutor.entity.enums.*;
import com.vn.aitutor.repository.*;
import com.vn.aitutor.security.jwt.JwtProvider;
import java.net.URI;
import java.net.http.*;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

/** PostgreSQL only, disposable DB; no application volume reset or history mutation. */
@EnabledIfEnvironmentVariable(named = "QUIZ_INTEGRATION", matches = "true")
@Import(ProgressStreakIntegrationTest.TestTime.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "app.analytics.seed-demo=false", "app.analytics.knowledge-gap-job=false", "app.analytics.at-risk-job=false",
    "app.quiz.expiry-scan-ms=3600000", "app.gamification.streak-reset-cron=-",
    "spring.rabbitmq.listener.simple.auto-startup=false", "spring.jpa.show-sql=false",
    "app.jwt.secret=progress-integration-only-signing-key-0123456789012345678901234567890123456789"
})
class ProgressStreakIntegrationTest {
    static final Instant NOW = Instant.parse("2026-10-14T17:30:00Z");
    static class TestClock extends Clock {
        final AtomicReference<Instant> time = new AtomicReference<>(NOW);
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return Clock.fixed(instant(), zone); }
        public Instant instant() { return time.get(); }
    }
    @TestConfiguration static class TestTime {
        @Bean @Primary TestClock testClock() { return new TestClock(); }
    }
    @Autowired TestClock clock;
    @Autowired StudentProgressService progress;
    @Autowired QuizSubmissionService submissions;
    @Autowired IStudentProfileService profiles;
    @Autowired IAdminStudentService admin;
    @Autowired StreakResetJob resetJob;
    @Autowired StreakResetService resets;
    @Autowired UserRepository users;
    @Autowired StudentRepository students;
    @Autowired QuizRepository quizzes;
    @Autowired QuizQuestionRepository questions;
    @Autowired JdbcTemplate jdbc;
    @Autowired JwtProvider tokens;
    @Autowired ObjectMapper json;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
    @LocalServerPort int port;
    User user;
    Student student;
    Quiz quiz;
    QuizQuestion question;

    @BeforeEach void fixture() {
        clock.time.set(NOW);
        user = user(Role.STUDENT);
        student = new Student(); student.setUser(user); student.setStudentCode("PROGRESS-" + UUID.randomUUID());
        student.setGradeLevel("10"); student = students.saveAndFlush(student);
        quiz = new Quiz(); quiz.setTitle("Progress private quiz"); quiz.setSubject("Toán"); quiz.setDifficulty(QuizDifficulty.EASY);
        quiz.setCreatedBy(user); quiz.setActive(true); quiz.setAiGenerated(true); quiz.setTimeLimit(30);
        quiz = quizzes.saveAndFlush(quiz);
        question = new QuizQuestion(); question.setQuiz(quiz); question.setQuestionText("Private question");
        question.setType(QuestionType.MULTIPLE_CHOICE); question.setOrderIndex(1);
        question.setOptions(List.of(Map.of("key", "A", "content", "One"), Map.of("key", "B", "content", "Two")));
        question.setCorrectOptionKey("A"); question.setExplanation("Private explanation"); question = questions.saveAndFlush(question);
        authenticate();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    void authenticate() { SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user.getUsername(), "unused")); }
    User user(Role role) {
        User value = new User(); value.setUsername("progress-" + UUID.randomUUID());
        value.setEmail(value.getUsername() + "@example.invalid"); value.setFullName("Progress Test");
        value.setPasswordHash("unused"); value.setGender(Gender.OTHER); value.setRole(role); value.setActive(true);
        return users.saveAndFlush(value);
    }
    UUID submit(boolean correct) {
        UUID draft = submissions.saveDraft(new QuizDraftRequest(quiz.getId(), null, List.of())).draftId();
        clock.time.updateAndGet(value -> value.plusSeconds(60));
        submissions.submit(new QuizSubmitRequest(draft, List.of(new QuizAnswerRequest(question.getId(), correct ? "A" : "B"))));
        return draft;
    }
    Student stored() { return students.findById(student.getId()).orElseThrow(); }
    void state(int current, int longest, Instant last) {
        jdbc.update("UPDATE students SET current_streak=?,longest_streak=?,last_activity_date=? WHERE id=?",
                current, longest, last == null ? null : Timestamp.from(last), student.getId());
    }

    @Test void emptyProgressIsRealZerosAndSevenLocalDays() {
        var result = progress.getMyProgress();
        assertEquals(7, result.dailyActivity().size());
        assertEquals(LocalDate.parse("2026-10-09"), result.dailyActivity().get(0).date());
        assertEquals(LocalDate.parse("2026-10-15"), result.dailyActivity().get(6).date());
        assertTrue(result.dailyActivity().stream().allMatch(d -> d.quizCount() == 0 && d.studyMinutes() == 0 && d.xpEarned() == 0));
        assertEquals(1, result.summary().currentLevel()); assertEquals(100, result.summary().xpToNextLevel());
        assertTrue(result.subjectStats().isEmpty()); assertTrue(result.recentQuizzes().isEmpty());
        assertNull(result.summary().lastLearningActivityAt());
    }

    @Test void submitRetakeAndRetryUpdateOneStreakAndNeverMultiplyLedger() {
        UUID first = submit(true);
        Instant last = stored().getLastActivityDate();
        clock.time.updateAndGet(value -> value.plusSeconds(120));
        submissions.submit(new QuizSubmitRequest(first, List.of()));
        assertEquals(last, stored().getLastActivityDate(), "Retry is not a new activity");
        submit(true);
        var result = progress.getMyProgress();
        assertEquals(10, result.summary().totalXp()); assertEquals(1, result.summary().currentStreak());
        assertEquals(1, result.summary().longestStreak());
        assertEquals(2, result.dailyActivity().get(6).quizCount());
        assertEquals(2, result.dailyActivity().get(6).studyMinutes());
        assertEquals(10, result.dailyActivity().get(6).xpEarned());
        assertEquals(2, result.subjectStats().get(0).attemptCount());
        assertEquals(10, result.subjectStats().get(0).xpEarned());
        assertEquals(10.0, result.subjectStats().get(0).averageScore());
        assertEquals(10.0, result.subjectStats().get(0).bestScore());
        assertEquals(clock.instant(), result.summary().lastLearningActivityAt());
    }

    @Test void streakCountsZeroScoreAndRetakeAcrossLocalMidnightThenRestartsAfterGap() {
        clock.time.set(Instant.parse("2026-10-14T16:57:00Z"));
        submit(false);
        assertEquals(1, stored().getCurrentStreak()); assertEquals(0, stored().getTotalXp());
        clock.time.set(NOW);
        submit(true);
        assertEquals(2, stored().getCurrentStreak()); assertEquals(0, stored().getTotalXp());
        clock.time.set(NOW.plusSeconds(3 * 86400));
        assertEquals(0, progress.getMyProgress().summary().currentStreak());
        submit(false);
        assertEquals(1, stored().getCurrentStreak()); assertEquals(2, stored().getLongestStreak());
    }

    @Test void localBoundariesExcludeDayEightAndRecentFiveHonorHiding() {
        Instant start = Instant.parse("2026-10-08T17:00:00Z");
        for (int i = 0; i < 8; i++) {
            Instant at = start.minusSeconds(1).plusSeconds(i);
            UUID id = UUID.randomUUID();
            jdbc.update("INSERT INTO quiz_attempts(id,student_id,quiz_id,score,xp_earned,duration_seconds,submitted_at) VALUES (?,?,?,5,0,30,?)",
                    id, student.getId(), quiz.getId(), Timestamp.from(at));
            jdbc.update("INSERT INTO xp_transactions(id,student_id,source_type,source_id,reference_id,amount,balance_after,occurred_at) VALUES (?,?,'LEGACY_QUIZ_ATTEMPT',?,?,10,?,?)",
                    UUID.randomUUID(), student.getId(), id, id, (i + 1) * 10, Timestamp.from(at));
            if (i == 7) jdbc.update("UPDATE quiz_attempts SET is_visible=false WHERE id=?", id);
        }
        var result = progress.getMyProgress();
        assertEquals(7, result.dailyActivity().get(0).quizCount());
        assertEquals(3, result.dailyActivity().get(0).studyMinutes());
        assertEquals(70, result.dailyActivity().get(0).xpEarned());
        assertEquals(80, result.subjectStats().get(0).xpEarned());
        assertEquals(0, result.summary().totalXp(), "Do not silently repair historical summary differences");
        assertEquals(5, result.recentQuizzes().size());
        assertEquals(start.plusSeconds(5), result.recentQuizzes().get(0).submittedAt());
    }

    @Test void cappedCompletionStillCountsForStreak() {
        jdbc.update("UPDATE students SET total_xp=500,current_level=6 WHERE id=?", student.getId());
        jdbc.update("INSERT INTO xp_transactions(id,student_id,source_type,source_id,amount,balance_after,occurred_at) VALUES (?,?,'LEGACY_QUIZ_ATTEMPT',?,500,500,?)",
                UUID.randomUUID(), student.getId(), UUID.randomUUID(), Timestamp.from(NOW.minusSeconds(60)));
        submit(true);
        assertEquals(1, stored().getCurrentStreak()); assertEquals(500, stored().getTotalXp());
        assertEquals("DAILY_CAP_REACHED", jdbc.queryForObject("SELECT xp_award_status FROM quiz_attempts WHERE student_id=?", String.class, student.getId()));
        assertEquals(500, progress.getMyProgress().dailyActivity().get(6).xpEarned());
    }

    @Test void otherStudentsActivityNeverLeaksIntoProgress() {
        User other = user(Role.STUDENT);
        Student stranger = new Student(); stranger.setUser(other); stranger.setStudentCode(UUID.randomUUID().toString());
        stranger = students.saveAndFlush(stranger);
        UUID attempt = UUID.randomUUID();
        jdbc.update("INSERT INTO quiz_attempts(id,student_id,quiz_id,score,xp_earned,duration_seconds,submitted_at) VALUES (?,?,?,10,0,300,?)",
                attempt, stranger.getId(), quiz.getId(), Timestamp.from(NOW));
        jdbc.update("INSERT INTO xp_transactions(id,student_id,source_type,source_id,reference_id,amount,balance_after,occurred_at) VALUES (?,?,'LEGACY_QUIZ_ATTEMPT',?,?,300,300,?)",
                UUID.randomUUID(), stranger.getId(), attempt, attempt, Timestamp.from(NOW));
        var result = progress.getMyProgress();
        assertTrue(result.subjectStats().isEmpty()); assertTrue(result.recentQuizzes().isEmpty());
        assertTrue(result.dailyActivity().stream().allMatch(day -> day.quizCount() == 0 && day.xpEarned() == 0));
    }

    @Test void staleStreakAgreesAcrossProgressProfileAdminAndIdempotentReset() {
        state(4, 9, NOW.minusSeconds(3 * 86400));
        assertEquals(0, profiles.getMyProfile(user.getId()).getData().getCurrentStreak());
        assertEquals(0, progress.getMyProgress().summary().currentStreak());
        assertEquals(0, admin.getStudentDetail(student.getId()).getData().getCurrentStreak());
        assertEquals(4, stored().getCurrentStreak(), "Read APIs must not mutate history");
        resetJob.resetExpiredStreaks(); resetJob.resetExpiredStreaks();
        assertEquals(0, stored().getCurrentStreak()); assertEquals(9, stored().getLongestStreak());
        state(4, 9, Instant.parse("2026-10-13T17:00:00Z"));
        resetJob.resetExpiredStreaks();
        assertEquals(4, stored().getCurrentStreak(), "Yesterday is not expired");
    }

    @Test void resetSkipsLockedStudentAndRetriesLater() throws Exception {
        state(4, 9, NOW.minusSeconds(3 * 86400));
        ExecutorService pool = Executors.newSingleThreadExecutor();
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                students.lockById(student.getId()).orElseThrow();
                try { pool.submit(() -> resets.resetBatch(Instant.parse("2026-10-13T17:00:00Z"))).get(5, TimeUnit.SECONDS); }
                catch (Exception ex) { throw new AssertionError("Reset blocked on a Student lock", ex); }
                assertEquals(4, jdbc.queryForObject("SELECT current_streak FROM students WHERE id=?", Integer.class, student.getId()));
            });
        } finally { pool.shutdownNow(); }
        resetJob.resetExpiredStreaks(); assertEquals(0, stored().getCurrentStreak());
        submit(false); assertEquals(1, stored().getCurrentStreak());
    }

    @Test void failureAfterStreakMutationRollsBackWholeSubmission() {
        state(3, 7, NOW.minusSeconds(86400));
        UUID draft = submissions.saveDraft(new QuizDraftRequest(quiz.getId(), null, List.of())).draftId();
        jdbc.execute("ALTER TABLE quiz_attempt_answers ADD CONSTRAINT task23_reject_answer CHECK (question_id <> '" + question.getId() + "'::uuid) NOT VALID");
        try {
            assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                    () -> submissions.submit(new QuizSubmitRequest(draft, List.of(new QuizAnswerRequest(question.getId(), "A")))));
            assertEquals(3, stored().getCurrentStreak()); assertEquals(7, stored().getLongestStreak());
            assertEquals(NOW.minusSeconds(86400), stored().getLastActivityDate());
            assertEquals(0, stored().getTotalXp());
            assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM quiz_attempts WHERE student_id=?", Integer.class, student.getId()));
            assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM xp_transactions WHERE student_id=?", Integer.class, student.getId()));
            assertNull(jdbc.queryForObject("SELECT completed_at FROM quiz_attempt_drafts WHERE id=?", Timestamp.class, draft));
        } finally { jdbc.execute("ALTER TABLE quiz_attempt_answers DROP CONSTRAINT task23_reject_answer"); }
        submissions.submit(new QuizSubmitRequest(draft, List.of()));
        assertEquals(4, stored().getCurrentStreak());
    }

    @Test void httpCookieAuthRoleOwnershipAllowlistAndOpenApi() throws Exception {
        submit(true);
        HttpResponse<String> response = get("/api/v1/students/me/progress", null);
        assertEquals(401, response.statusCode());
        assertEquals(403, get("/api/v1/students/me/progress", user(Role.TEACHER)).statusCode());
        assertEquals(403, get("/api/v1/students/me/progress", user(Role.ADMIN)).statusCode());
        assertEquals(403, get("/api/v1/students/me/progress", user(Role.STUDENT)).statusCode());
        response = get("/api/v1/students/me/progress?studentId=" + UUID.randomUUID(), user);
        assertEquals(200, response.statusCode());
        var data = json.readTree(response.body()).get("data");
        assertEquals(10, data.get("summary").get("totalXp").asInt());
        assertEquals(7, data.get("dailyActivity").size());
        assertEquals(1, data.get("recentQuizzes").size());
        for (String field : List.of("email", "studentCode", "parentName", "phoneNumber", "correctOptionKey", "explanation", "answers", "passwordHash")) {
            assertFalse(response.body().contains("\"" + field + "\""), field);
        }
        assertEquals(200, get("/v3/api-docs", null).statusCode());
        var schema = json.readTree(get("/v3/api-docs", null).body());
        var operation = schema.get("paths").get("/api/v1/students/me/progress").get("get");
        for (String code : List.of("200", "401", "403", "404")) assertTrue(operation.get("responses").has(code));
        assertTrue(schema.get("components").get("schemas").has("StudentProgressResponse"));
    }

    HttpResponse<String> get(String path, User account) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET();
        if (account != null) request.header("Cookie", "access_token=" + tokens.generateAccessToken(account));
        return HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
