package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.*;
import com.vn.aitutor.dto.response.*;
import com.vn.aitutor.entity.*;
import com.vn.aitutor.entity.enums.*;
import com.vn.aitutor.exception.*;
import com.vn.aitutor.repository.*;
import com.vn.aitutor.security.jwt.JwtProvider;
import java.net.URI;
import java.net.http.*;
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
import static org.junit.jupiter.api.Assertions.*;

/** Run against a disposable PostgreSQL database with QUIZ_INTEGRATION=true. */
@EnabledIfEnvironmentVariable(named = "QUIZ_INTEGRATION", matches = "true")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "app.analytics.seed-demo=false", "app.analytics.knowledge-gap-job=false", "app.analytics.at-risk-job=false",
    "app.quiz.expiry-scan-ms=3600000", "spring.rabbitmq.listener.simple.auto-startup=false", "spring.jpa.show-sql=false",
    "app.jwt.secret=quiz-integration-only-signing-key-0123456789012345678901234567890123456789"
})
class QuizSubmissionIntegrationTest {
    @Autowired QuizSubmissionService submissions;
    @Autowired IStudentQuizAttemptService history;
    @Autowired UserRepository users;
    @Autowired StudentRepository students;
    @Autowired QuizRepository quizzes;
    @Autowired QuizQuestionRepository questions;
    @Autowired JdbcTemplate jdbc;
    @Autowired JwtProvider tokens;
    @LocalServerPort int port;
    User user;
    Student student;
    Quiz quiz;
    List<QuizQuestion> quizQuestions;

    @BeforeEach void fixture() {
        user = new User(); user.setUsername("quiz-test-" + UUID.randomUUID());
        user.setEmail(user.getUsername() + "@example.invalid"); user.setFullName("Quiz Test");
        user.setPasswordHash("unused"); user.setGender(Gender.OTHER); user.setRole(Role.STUDENT);
        user.setActive(true); user = users.saveAndFlush(user);
        student = new Student(); student.setUser(user); student.setStudentCode("TEST-" + UUID.randomUUID());
        student.setGradeLevel("10"); student.setTotalXp(90); student = students.saveAndFlush(student);
        assertNotEquals(user.getId(), student.getId());
        quiz = new Quiz(); quiz.setTitle("Quiz integration"); quiz.setCreatedBy(user); quiz.setAiGenerated(true);
        quiz.setSubject("Toán"); quiz.setDifficulty(QuizDifficulty.MEDIUM); quiz.setTimeLimit(1); quiz.setGradeLevel("10");
        quiz = quizzes.saveAndFlush(quiz);
        quizQuestions = new ArrayList<>();
        for (QuestionType type : QuestionType.values()) {
            QuizQuestion question = new QuizQuestion(); question.setQuiz(quiz); question.setQuestionText("Test " + type);
            question.setType(type); question.setOrderIndex(quizQuestions.size() + 1); question.setExplanation("Explanation " + type);
            boolean choice = type == QuestionType.MULTIPLE_CHOICE || type == QuestionType.TRUE_FALSE;
            question.setCorrectOptionKey(choice ? "A" : "Hà Nội");
            question.setOptions(choice ? List.of(Map.of("key", "A", "content", "Đúng"), Map.of("key", "B", "content", "Sai")) : List.of());
            quizQuestions.add(questions.saveAndFlush(question));
        }
        authenticate();
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }
    void authenticate() { SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(user.getUsername(), "unused")); }
    List<QuizAnswerRequest> correctAnswers() { return quizQuestions.stream().map(q -> new QuizAnswerRequest(q.getId(), q.getCorrectOptionKey())).toList(); }
    QuizDraftResponse draft() { return submissions.saveDraft(new QuizDraftRequest(quiz.getId(), null, List.of())); }

    @Test void savesResumesSubmitsAndRewardsOnlyFirstCompletion() {
        QuizDraftResponse draft = draft();
        assertEquals(draft.draftId(), draft().draftId());
        submissions.saveDraft(new QuizDraftRequest(quiz.getId(), draft.draftId(), correctAnswers()));
        assertEquals(4, submissions.getDraft(draft.draftId()).answeredCount());
        submissions.saveDraft(new QuizDraftRequest(quiz.getId(), draft.draftId(), List.of(new QuizAnswerRequest(quizQuestions.get(0).getId(), "B"))));
        assertEquals(4, jdbc.queryForObject("SELECT count(*) FROM quiz_attempt_draft_answers WHERE draft_id=?", Integer.class, draft.draftId()));
        QuizAttemptDetailResponse result = submissions.submit(new QuizSubmitRequest(draft.draftId(), correctAnswers()));
        assertEquals(10.0, result.getScore()); assertEquals(40, result.getXpEarned()); assertEquals(130, result.getTotalXp()); assertEquals(2, result.getCurrentLevel());
        assertEquals(result.getId(), submissions.submit(new QuizSubmitRequest(draft.draftId(), List.of())).getId());
        assertEquals(1, history.getMyHistory().size()); assertEquals(4, result.getAnswers().size());
        QuizDraftResponse retake = draft(); assertNotEquals(draft.draftId(), retake.draftId());
        QuizAttemptDetailResponse second = submissions.submit(new QuizSubmitRequest(retake.draftId(), correctAnswers()));
        assertEquals(0, second.getXpEarned()); assertEquals(130, second.getTotalXp());
        history.hideAttempt(result.getId()); history.hideAttempt(result.getId());
        assertEquals(1, history.getMyHistory().size()); assertEquals(130, students.findById(student.getId()).orElseThrow().getTotalXp());
        assertThrows(org.springframework.dao.DataAccessException.class, () -> jdbc.update("UPDATE quiz_attempts SET score=0 WHERE id=?", result.getId()));
        assertThrows(org.springframework.dao.DataAccessException.class, () -> jdbc.update("UPDATE quiz_attempt_answers SET is_correct=false WHERE attempt_id=?", result.getId()));
    }

    @Test void expiryIgnoresLateAnswersAndSchedulerIsIdempotent() throws Exception {
        QuizDraftResponse draft = draft();
        submissions.saveDraft(new QuizDraftRequest(quiz.getId(), draft.draftId(), List.of(new QuizAnswerRequest(quizQuestions.get(0).getId(), "A"))));
        jdbc.update("UPDATE quiz_attempt_drafts SET started_at=now()-interval '61 seconds', expires_at=now()-interval '1 second' WHERE id=?", draft.draftId());
        assertThrows(ResourceConflictException.class, () -> submissions.saveDraft(new QuizDraftRequest(quiz.getId(), draft.draftId(), correctAnswers())));
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> scheduler = executor.submit(() -> submissions.expire(draft.draftId()));
            Future<QuizAttemptDetailResponse> client = executor.submit(() -> { authenticate(); try { return submissions.submit(new QuizSubmitRequest(draft.draftId(), correctAnswers())); } finally { clear(); } });
            scheduler.get(10, TimeUnit.SECONDS); QuizAttemptDetailResponse result = client.get(10, TimeUnit.SECONDS);
            assertEquals(1, result.getCorrectCount()); assertEquals(2.5, result.getScore()); assertEquals(10, result.getXpEarned());
            assertEquals(60, result.getDurationSeconds()); assertEquals(100, result.getTotalXp());
            assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM quiz_attempts WHERE source_draft_id=?", Integer.class, draft.draftId()));
        } finally { executor.shutdownNow(); }
    }

    @Test void concurrentStartAndSubmitProduceSingleDraftAndAttempt() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(4);
        try {
            List<Callable<QuizDraftResponse>> startCalls = Collections.nCopies(4, () -> { authenticate(); try { return draft(); } finally { clear(); } });
            Set<UUID> draftIds = new HashSet<>();
            for (Future<QuizDraftResponse> future : executor.invokeAll(startCalls)) draftIds.add(future.get().draftId());
            assertEquals(1, draftIds.size()); UUID draftId = draftIds.iterator().next();
            List<Callable<QuizAttemptDetailResponse>> submitCalls = Collections.nCopies(4, () -> { authenticate(); try { return submissions.submit(new QuizSubmitRequest(draftId, correctAnswers())); } finally { clear(); } });
            Set<UUID> attemptIds = new HashSet<>();
            for (Future<QuizAttemptDetailResponse> future : executor.invokeAll(submitCalls)) attemptIds.add(future.get().getId());
            assertEquals(1, attemptIds.size()); assertEquals(130, students.findById(student.getId()).orElseThrow().getTotalXp());
        } finally { executor.shutdownNow(); }
    }

    @Test void zeroFirstAttemptPreventsRewardOnRetake() {
        QuizAttemptDetailResponse first = submissions.submit(new QuizSubmitRequest(draft().draftId(), List.of()));
        assertEquals(0, first.getXpEarned()); assertEquals(0.0, first.getScore());
        QuizAttemptDetailResponse second = submissions.submit(new QuizSubmitRequest(draft().draftId(), correctAnswers()));
        assertEquals(0, second.getXpEarned()); assertEquals(90, second.getTotalXp());
    }

    @Test void concurrentDifferentQuizzesDoNotLoseXp() throws Exception {
        Quiz secondQuiz = new Quiz(); secondQuiz.setTitle("Second concurrent quiz"); secondQuiz.setCreatedBy(user);
        secondQuiz.setAiGenerated(true); secondQuiz.setDifficulty(QuizDifficulty.MEDIUM); secondQuiz.setTimeLimit(1);
        secondQuiz = quizzes.saveAndFlush(secondQuiz);
        QuizQuestion question = new QuizQuestion(); question.setQuiz(secondQuiz); question.setQuestionText("2+2?");
        question.setType(QuestionType.MULTIPLE_CHOICE); question.setOptions(quizQuestions.get(0).getOptions());
        question.setCorrectOptionKey("A"); question.setExplanation("2+2=4"); question = questions.saveAndFlush(question);
        UUID firstDraft = draft().draftId();
        UUID secondDraft = submissions.saveDraft(new QuizDraftRequest(secondQuiz.getId(), null, List.of())).draftId();
        List<QuizAnswerRequest> secondAnswers = List.of(new QuizAnswerRequest(question.getId(), "A"));
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(() -> { authenticate(); try { return submissions.submit(new QuizSubmitRequest(firstDraft, correctAnswers())); } finally { clear(); } });
            var second = executor.submit(() -> { authenticate(); try { return submissions.submit(new QuizSubmitRequest(secondDraft, secondAnswers)); } finally { clear(); } });
            assertEquals(40, first.get(10, TimeUnit.SECONDS).getXpEarned());
            assertEquals(10, second.get(10, TimeUnit.SECONDS).getXpEarned());
            assertEquals(140, students.findById(student.getId()).orElseThrow().getTotalXp());
        } finally { executor.shutdownNow(); }
    }

    @Test void rejectsForeignDataAndIncompleteQuiz() {
        QuizDraftResponse draft = draft();
        assertThrows(ResourceBadRequestException.class, () -> submissions.saveDraft(new QuizDraftRequest(quiz.getId(), draft.draftId(), List.of(new QuizAnswerRequest(UUID.randomUUID(), "A")))));
        assertThrows(ResourceBadRequestException.class, () -> submissions.saveDraft(new QuizDraftRequest(quiz.getId(), draft.draftId(), List.of(new QuizAnswerRequest(quizQuestions.get(0).getId(), "Z")))));
        assertThrows(ResourceBadRequestException.class, () -> submissions.saveDraft(new QuizDraftRequest(quiz.getId(), draft.draftId(), List.of(new QuizAnswerRequest(quizQuestions.get(2).getId(), "x".repeat(201))))));
        User other = new User(); other.setUsername("other-" + UUID.randomUUID()); other.setEmail(other.getUsername()+"@example.invalid");
        other.setPasswordHash("unused"); other.setFullName("Other"); other.setGender(Gender.OTHER); other.setRole(Role.STUDENT); other = users.saveAndFlush(other);
        Student otherStudent = new Student(); otherStudent.setUser(other); otherStudent.setStudentCode(UUID.randomUUID().toString()); students.saveAndFlush(otherStudent);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(other.getUsername(), "unused"));
        assertThrows(ResourceForbiddenException.class, () -> submissions.getDraft(draft.draftId()));
        assertThrows(ResourceForbiddenException.class, () -> submissions.content(quiz.getId()));
        authenticate(); quiz.setGenerationStatus("PROCESSING"); quizzes.saveAndFlush(quiz);
        assertThrows(ResourceConflictException.class, () -> submissions.content(quiz.getId()));
    }

    @Test void realHttpValidatesPayloadRoleAndDoesNotExposeAnswers() throws Exception {
        String token = tokens.generateAccessToken(user);
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/student/quizzes/" + quiz.getId()))
                .header("Authorization", "Bearer " + token).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode()); assertFalse(response.body().contains("correctOptionKey")); assertFalse(response.body().contains("explanation"));
        String oversized = "{\"quizId\":\""+quiz.getId()+"\",\"answers\":[{\"questionId\":\""+quizQuestions.get(2).getId()+"\",\"value\":\""+"x".repeat(201)+"\"}]}";
        response = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/student/quiz-attempts/draft"))
                .header("Authorization", "Bearer " + token).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(oversized)).build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(400, response.statusCode());
        QuizDraftResponse draft = draft();
        String forged = "{\"draftId\":\""+draft.draftId()+"\",\"answers\":[],\"score\":10,\"xpEarned\":999,\"durationSeconds\":1}";
        response = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/student/quiz-attempts/submit"))
                .header("Authorization", "Bearer " + token).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(forged)).build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        QuizAttemptDetailResponse result = submissions.submit(new QuizSubmitRequest(draft.draftId(), List.of()));
        assertEquals(0.0, result.getScore()); assertEquals(0, result.getXpEarned());
        for (String method : List.of("PUT", "PATCH", "DELETE")) {
            response = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/student/quiz-attempts/" + result.getId()))
                    .header("Authorization", "Bearer " + token).method(method, HttpRequest.BodyPublishers.noBody()).build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(403, response.statusCode());
        }
        user.setRole(Role.TEACHER); users.saveAndFlush(user);
        response = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/student/quiz-attempts/history"))
                .header("Authorization", "Bearer " + tokens.generateAccessToken(user)).GET().build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(403, response.statusCode());
    }
}
