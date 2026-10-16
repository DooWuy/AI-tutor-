package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.*;
import com.vn.aitutor.entity.*;
import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.QuizDifficulty;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.entity.enums.LeaderboardScope;
import com.vn.aitutor.repository.*;
import com.vn.aitutor.security.jwt.JwtProvider;
import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "QUIZ_INTEGRATION", matches = "true")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "app.analytics.seed-demo=false", "app.analytics.knowledge-gap-job=false", "app.analytics.at-risk-job=false",
    "app.quiz.expiry-scan-ms=3600000", "app.gamification.streak-reset-cron=-",
    "spring.rabbitmq.listener.simple.auto-startup=false", "spring.jpa.show-sql=false",
    "app.jwt.secret=leaderboard-integration-only-signing-key-0123456789012345678901234567890123456789"
})
class LeaderboardIntegrationTest {
    @Autowired LeaderboardService leaderboard;
    @Autowired LeaderboardRepository rankings;
    @Autowired QuizSubmissionService submissions;
    @Autowired UserRepository users;
    @Autowired QuizRepository quizzes;
    @Autowired QuizQuestionRepository questions;
    @Autowired JdbcTemplate jdbc;
    @Autowired JwtProvider tokens;
    @Autowired ObjectMapper json;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
    @LocalServerPort int port;
    User user;
    UUID studentId;
    UUID classId;
    final Instant earlier = Instant.parse("2026-10-10T02:00:00Z");

    @BeforeEach void fixture() {
        classId = schoolClass();
        user = account("Current", Role.STUDENT, true, false);
        studentId = addStudent(user, UUID.randomUUID(), classId, 0);
        authenticate();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    void authenticate() { SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user.getUsername(), "unused")); }
    UUID schoolClass() {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO school_classes(id,name,grade_level,academic_year) VALUES (?,?, '10','2026-2027')", id, "Class-" + id);
        return id;
    }
    User account(String name, Role role, boolean active, boolean deleted) {
        User value = new User(); value.setUsername("rank-" + UUID.randomUUID()); value.setEmail(value.getUsername() + "@example.invalid");
        value.setPasswordHash("unused"); value.setFullName(name); value.setGender(Gender.OTHER);
        value.setRole(role); value.setActive(active); value.setDeleted(deleted);
        return users.saveAndFlush(value);
    }
    UUID addStudent(User value, UUID id, UUID group, int xp) {
        jdbc.update("INSERT INTO students(id,user_id,student_code,class_id,total_xp,current_level) VALUES (?,?,?,?,?,99)",
                id, value.getId(), "RANK-" + id, group, xp);
        return id;
    }
    UUID peer(String name, int xp) {
        UUID id = addStudent(account(name, Role.STUDENT, true, false), UUID.randomUUID(), classId, xp);
        if (xp > 0) award(id, xp, xp, earlier);
        return id;
    }
    void award(UUID id, int amount, int balance, Instant at) {
        jdbc.update("INSERT INTO xp_transactions(id,student_id,source_type,source_id,amount,balance_after,occurred_at) VALUES (?,?,'LEGACY_QUIZ_ATTEMPT',?,?,?,?)",
                UUID.randomUUID(), id, UUID.randomUUID(), amount, balance, Timestamp.from(at));
    }
    List<String> classNames() { return leaderboard.getLeaderboard(LeaderboardScope.CLASS, 50).entries().stream().map(e -> e.displayName()).toList(); }

    @Test void ordersXpThenCurrentThresholdTimeRatherThanFirstAward() {
        UUID firstXp = addStudent(account("Early first XP, late total", Role.STUDENT, true, false), UUID.randomUUID(), classId, 100);
        award(firstXp, 30, 30, earlier.minusSeconds(3600)); award(firstXp, 70, 100, earlier.plusSeconds(3600));
        peer("Earlier total", 100); peer("Most XP", 200);
        assertEquals(List.of("Most XP", "Earlier total", "Early first XP, late total", "Current"), classNames());
    }

    @Test void exactTimeTiesAndUnknownTimesUseStableUuidOrder() {
        UUID small = UUID.fromString("11111111-0000-0000-0000-" + UUID.randomUUID().toString().substring(24));
        UUID large = UUID.fromString("eeeeeeee-0000-0000-0000-" + UUID.randomUUID().toString().substring(24));
        addStudent(account("UUID later", Role.STUDENT, true, false), large, classId, 100);
        addStudent(account("UUID earlier", Role.STUDENT, true, false), small, classId, 100);
        award(large, 100, 100, earlier); award(small, 100, 100, earlier);
        assertEquals(List.of("UUID earlier", "UUID later", "Current"), classNames());
        jdbc.update("UPDATE students SET total_xp=101 WHERE class_id=? AND id<>?", classId, studentId);
        assertEquals(List.of("UUID earlier", "UUID later", "Current"), classNames());
    }

    @Test void historicalMismatchNeverFabricatesAchievementTime() {
        UUID mismatch = addStudent(account("Mismatch", Role.STUDENT, true, false), UUID.randomUUID(), classId, 100);
        award(mismatch, 50, 100, earlier.minusSeconds(86400));
        peer("Known", 100);
        assertEquals(List.of("Known", "Mismatch", "Current"), classNames());
        assertEquals(100, jdbc.queryForObject("SELECT total_xp FROM students WHERE id=?", Integer.class, mismatch));
    }

    @Test void excludesInactiveDeletedAndNonStudentAccountsFromRankAndEntries() {
        for (User invalid : List.of(account("Inactive", Role.STUDENT, false, false),
                account("Deleted", Role.STUDENT, true, true), account("Teacher", Role.TEACHER, true, false),
                account("Admin", Role.ADMIN, true, false))) {
            addStudent(invalid, UUID.randomUUID(), classId, 1000);
        }
        peer("Allowed", 10);
        var result = leaderboard.getLeaderboard(LeaderboardScope.CLASS, 20);
        assertEquals(List.of("Allowed", "Current"), result.entries().stream().map(e -> e.displayName()).toList());
        assertEquals(2, result.me().rank()); assertEquals(1, result.me().currentLevel());
    }

    @Test void globalMeOutsideDefaultTopAndExplicitLimitsRemainBounded() throws Exception {
        for (int i = 0; i < 25; i++) peer("Top " + i, 1000 + i);
        var data = json.readTree(get("", user).body()).get("data");
        assertEquals("GLOBAL", data.get("scope").asText()); assertEquals(20, data.get("entries").size());
        assertTrue(data.get("me").get("rank").asLong() > 20);
        assertEquals(1, leaderboard.getLeaderboard(LeaderboardScope.GLOBAL, 1).entries().size());
        assertTrue(leaderboard.getLeaderboard(LeaderboardScope.GLOBAL, 50).entries().size() <= 50);
    }

    @Test void meInsideTopEqualsEntryAndClassHasNoOtherClassData() throws Exception {
        peer("My class", 10);
        UUID otherClass = schoolClass();
        addStudent(account("Another class", Role.STUDENT, true, false), UUID.randomUUID(), otherClass, 9999);
        var response = get("?scope=CLASS&classId=" + otherClass + "&studentId=" + UUID.randomUUID(), user);
        assertEquals(200, response.statusCode());
        var data = json.readTree(response.body()).get("data");
        assertEquals(2, data.get("entries").size());
        assertEquals(data.get("entries").get(1), data.get("me"));
        assertFalse(response.body().contains("Another class"));
    }

    @Test void missingClassReturnsStableBusinessCodeButGlobalStillWorks() throws Exception {
        jdbc.update("UPDATE students SET class_id=NULL,class_name='10A1' WHERE id=?", studentId);
        var response = get("?scope=CLASS", user);
        assertEquals(400, response.statusCode());
        assertEquals("STUDENT_CLASS_REQUIRED", json.readTree(response.body()).get("error").get("code").asText());
        assertEquals(200, get("", user).statusCode());
    }

    @Test void cookieAuthValidatesRolesParametersAndPublicFieldAllowlist() throws Exception {
        assertEquals(401, get("", null).statusCode());
        assertEquals(403, get("", account("Teacher", Role.TEACHER, true, false)).statusCode());
        assertEquals(403, get("", account("Admin", Role.ADMIN, true, false)).statusCode());
        assertEquals(403, get("", account("No profile", Role.STUDENT, true, false)).statusCode());
        for (String query : List.of("?scope=WEEK", "?scope=global", "?limit=0", "?limit=-1", "?limit=51", "?limit=text")) {
            assertEquals(400, get(query, user).statusCode(), query);
        }
        var response = get("?scope=CLASS", user); assertEquals(200, response.statusCode());
        var data = json.readTree(response.body()).get("data");
        Set<String> allowed = Set.of("rank", "displayName", "avatarUrl", "totalXp", "currentLevel");
        assertEquals(allowed, data.get("me").propertyNames());
        for (var entry : data.get("entries")) assertEquals(allowed, entry.propertyNames());
        for (String field : List.of("email", "phoneNumber", "address", "parentName", "studentCode", "studentId", "userId", "classId", "passwordHash")) {
            assertFalse(response.body().contains("\"" + field + "\""), field);
        }
    }

    @Test void deletedAndInactiveCurrentAccountsCannotReadLeaderboard() throws Exception {
        user.setActive(false); users.saveAndFlush(user); assertEquals(401, get("", user).statusCode());
        user.setActive(true); user.setDeleted(true); users.saveAndFlush(user); assertEquals(401, get("", user).statusCode());
    }

    @Test void committedQuizAwardChangesRankButUncommittedOrRolledBackAwardDoesNot() throws Exception {
        peer("Peer", 5);
        Quiz quiz = new Quiz(); quiz.setTitle("Ranking quiz"); quiz.setSubject("Toán"); quiz.setDifficulty(QuizDifficulty.EASY);
        quiz.setCreatedBy(user); quiz.setActive(true); quiz.setAiGenerated(true); quiz = quizzes.saveAndFlush(quiz);
        QuizQuestion question = new QuizQuestion(); question.setQuiz(quiz); question.setQuestionText("2+2?");
        question.setType(QuestionType.MULTIPLE_CHOICE); question.setOrderIndex(1); question.setCorrectOptionKey("A");
        question.setExplanation("4"); question.setOptions(List.of(Map.of("key", "A", "content", "4"), Map.of("key", "B", "content", "5")));
        question = questions.saveAndFlush(question);
        UUID draft = submissions.saveDraft(new QuizDraftRequest(quiz.getId(), null, List.of())).draftId();
        var answers = List.of(new QuizAnswerRequest(question.getId(), "A"));
        ExecutorService pool = Executors.newSingleThreadExecutor();
        try {
            TransactionTemplate tx = new TransactionTemplate(transactionManager);
            tx.executeWithoutResult(status -> {
                submissions.submit(new QuizSubmitRequest(draft, answers));
                assertOutsideReader(pool, 0, 2);
                status.setRollbackOnly();
            });
            assertOutsideReader(pool, 0, 2);
            tx.executeWithoutResult(status -> {
                submissions.submit(new QuizSubmitRequest(draft, answers));
                assertOutsideReader(pool, 0, 2);
            });
            assertOutsideReader(pool, 10, 1);
            submissions.submit(new QuizSubmitRequest(draft, List.of()));
            assertOutsideReader(pool, 10, 1);
        } finally { pool.shutdownNow(); }
    }

    void assertOutsideReader(ExecutorService pool, int xp, int rank) {
        try {
            var response = pool.submit(() -> get("?scope=CLASS", user)).get(10, TimeUnit.SECONDS);
            assertEquals(200, response.statusCode());
            var me = json.readTree(response.body()).get("data").get("me");
            assertEquals(xp, me.get("totalXp").asInt()); assertEquals(rank, me.get("rank").asInt());
        } catch (Exception ex) { throw new AssertionError(ex); }
    }

    @Test void openApiDocumentsScopeBoundsCookieAndBusinessErrors() throws Exception {
        var response = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/v3/api-docs")).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        var root = json.readTree(response.body());
        var operation = root.get("paths").get("/api/v1/leaderboard").get("get");
        for (String code : List.of("200", "400", "401", "403", "404")) assertTrue(operation.get("responses").has(code));
        assertTrue(root.get("components").get("schemas").has("LeaderboardResponse"));
        assertTrue(operation.get("security").toString().contains("studentCookieAuth"));
    }

    @Test @Order(Integer.MAX_VALUE) void explainActualQueriesOnFiveThousandStudentsAndOneHundredThousandAwards() throws Exception {
        String prefix = "perf-rank-" + UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users(id,username,email,password_hash,full_name,gender,role)
                SELECT md5(? || '-u-' || n)::uuid, ? || n, ? || n || '@example.invalid',
                       'unused','Ranking performance fixture','OTHER','STUDENT' FROM generate_series(1,5000) n
                """, prefix, prefix, prefix);
        jdbc.update("""
                INSERT INTO students(id,user_id,student_code,class_id,total_xp)
                SELECT md5(? || '-s-' || n)::uuid, md5(? || '-u-' || n)::uuid, ? || n, ?, 200
                FROM generate_series(1,5000) n
                """, prefix, prefix, prefix, classId);
        jdbc.update("""
                INSERT INTO xp_transactions(id,student_id,source_type,source_id,amount,balance_after,occurred_at)
                SELECT gen_random_uuid(), md5(? || '-s-' || n)::uuid, 'LEGACY_QUIZ_ATTEMPT', gen_random_uuid(),
                       10, step * 10, TIMESTAMPTZ '2026-10-10 02:00:00+00' + step * INTERVAL '1 second'
                FROM generate_series(1,5000) n CROSS JOIN generate_series(1,20) step
                """, prefix);
        jdbc.execute("ANALYZE students"); jdbc.execute("ANALYZE users"); jdbc.execute("ANALYZE xp_transactions");
        Path directory = Path.of("build/issue5-task4-results"); Files.createDirectories(directory);
        var global = jdbc.queryForList("EXPLAIN (ANALYZE, BUFFERS) " + LeaderboardRepository.GLOBAL_QUERY,
                String.class, studentId, 20, studentId);
        var scoped = jdbc.queryForList("EXPLAIN (ANALYZE, BUFFERS) " + LeaderboardRepository.CLASS_QUERY,
                String.class, classId, studentId, 20, studentId);
        Files.write(directory.resolve("explain-global.txt"), global); Files.write(directory.resolve("explain-class.txt"), scoped);
        assertTrue(global.stream().anyMatch(line -> line.contains("Execution Time:")));
        assertTrue(scoped.stream().anyMatch(line -> line.contains("Execution Time:")));
        assertEquals(21, rankings.findRanking(studentId, classId, 20).size());
        assertEquals(5001, leaderboard.getLeaderboard(LeaderboardScope.CLASS, 20).me().rank());
    }

    HttpResponse<String> get(String query, User account) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/leaderboard" + query)).GET();
        if (account != null) request.header("Cookie", "access_token=" + tokens.generateAccessToken(account));
        return HttpClient.newHttpClient().send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
