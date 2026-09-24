package com.vn.aitutor.config;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.entity.ChatMessage;
import com.vn.aitutor.entity.ChatSession;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizAttempt;
import com.vn.aitutor.entity.QuizAttemptAnswer;
import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.TeacherClassAssignment;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ChatSessionStatus;
import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.entity.enums.SenderType;
import com.vn.aitutor.entity.enums.QuizDifficulty;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.repository.ChatMessageRepository;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dev-only fixture so the Analytics Dashboard has a class matching AC-01
 * (40 students, 80 attempts, total score 640 → average 8.0).
 */
@Slf4j
@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.analytics.seed-demo", havingValue = "true")
@RequiredArgsConstructor
public class AnalyticsDemoDataSeeder implements ApplicationRunner {

    public static final String DEMO_TEACHER_EMAIL = "teacher.demo@aitutor.vn";
    public static final String DEMO_TEACHER_PASSWORD = "Teacher@123";

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptAnswerRepository quizAttemptAnswerRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PasswordEncoder passwordEncoder;
    private final AcademicCalendar academicCalendar;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(DEMO_TEACHER_EMAIL)) {
            seedKnowledgeGapsIfMissing();
            return;
        }
        seed();
        log.info(
                "Seeded analytics demo teacher {} / {} (class 12A1, 40 students, 80 quiz attempts totaling 640)",
                DEMO_TEACHER_EMAIL,
                DEMO_TEACHER_PASSWORD);
    }

    private void seed() {
        Instant now = Instant.now();
        String academicYear = academicCalendar.currentAcademicYear(now);
        String schoolName = "THPT AI Tutor";

        User teacherUser = persistUser("gv.demo", DEMO_TEACHER_EMAIL, "Nguyễn Thị Giáo", Role.TEACHER);
        Teacher teacher = new Teacher();
        teacher.setUser(teacherUser);
        teacher.setTeacherCode("TEA-DEMO01");
        teacher.setDepartment("Toán");
        teacher.setSubjectTaught(SubjectCode.TOAN.name());
        teacher.setSchoolName(schoolName);
        teacher = teacherRepository.save(teacher);

        SchoolClass class12A1 = persistClass("12A1", "12", schoolName, academicYear, teacher);
        SchoolClass class12A2 = persistClass("12A2", "12", schoolName, academicYear, null);

        persistAssignment(teacher, class12A1, null, true);
        persistAssignment(teacher, class12A1, SubjectCode.TOAN.name(), false);
        persistAssignment(teacher, class12A2, SubjectCode.TOAN.name(), false);

        Quiz quiz = new Quiz();
        quiz.setTitle("Kiểm tra Toán tuần — Tiệm cận");
        quiz.setDescription("Bài kiểm tra trắc nghiệm chương 1");
        quiz.setSubject(SubjectCode.TOAN.name());
        quiz.setGradeLevel("12");
        quiz.setDifficulty(QuizDifficulty.MEDIUM);
        quiz.setTimeLimit(30);
        quiz.setAiGenerated(false);
        quiz.setCreatedBy(teacherUser);
        quiz.setActive(true);
        quiz = quizRepository.save(quiz);

        List<Student> students = new ArrayList<>();
        List<QuizAttempt> attempts = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            String fullName = i == 0 ? "Nguyễn Văn A" : "Học sinh 12A1 " + String.format("%02d", i + 1);
            User studentUser = persistUser(
                    "hs12a1" + String.format("%02d", i + 1),
                    "student.12a1." + (i + 1) + "@aitutor.vn",
                    fullName,
                    Role.STUDENT);
            Student student = new Student();
            student.setUser(studentUser);
            student.setStudentCode("STU-12A1-" + String.format("%02d", i + 1));
            student.setGradeLevel("12");
            student.setClassName("12A1");
            student.setClassEntity(class12A1);
            student.setSchoolName(schoolName);
            student.setEmail(studentUser.getEmail());
            if (i == 0 || i == 1 || i == 2) {
                student.setLastActivityDate(now.minus(Duration.ofDays(8)));
            } else if (i == 3) {
                student.setLastActivityDate(null);
            } else {
                student.setLastActivityDate(now.minus(Duration.ofHours(i)));
            }
            students.add(studentRepository.save(student));
        }

        for (int i = 0; i < 40; i++) {
            Student student = students.get(i);
            for (int attemptIndex = 0; attemptIndex < 2; attemptIndex++) {
                QuizAttempt attempt = new QuizAttempt();
                attempt.setQuiz(quiz);
                attempt.setStudent(student);
                attempt.setScore(8.0);
                attempt.setXpEarned(10);
                attempt.setDurationSeconds(1800);
                int dayOffset = (i + attemptIndex) % 7;
                attempt.setSubmittedAt(now.minus(Duration.ofDays(dayOffset)).minus(Duration.ofMinutes(i * 3L)));
                attempts.add(quizAttemptRepository.save(attempt));
            }
        }

        for (int i = 0; i < 7; i++) {
            ChatSession session = new ChatSession();
            session.setStudent(students.get(i));
            session.setSubject(SubjectCode.TOAN.name());
            session.setTitle("Ôn tập tiệm cận");
            session.setStatus(ChatSessionStatus.CLOSED);
            session.setLastMessageAt(now.plus(Duration.ofMinutes(40)));
            chatSessionRepository.save(session);
        }
        seedKnowledgeGapFixture(quiz, students, attempts);
    }

    private void seedKnowledgeGapsIfMissing() {
        SchoolClass schoolClass = schoolClassRepository.findFirstByNameOrderByCreatedAtDesc("12A1").orElse(null);
        if (schoolClass == null) {
            log.warn("Skip knowledge-gap demo seed: class 12A1 not found");
            return;
        }
        Quiz quiz = quizRepository.findFirstByTitle("Kiểm tra Toán tuần — Tiệm cận").orElse(null);
        if (quiz == null) {
            log.warn("Skip knowledge-gap demo seed: demo quiz not found");
            return;
        }
        List<Student> students = studentRepository.findByClassEntity_IdOrderByStudentCodeAsc(schoolClass.getId());
        List<QuizAttempt> attempts = quizAttemptRepository.findByClassAndQuiz(schoolClass.getId(), quiz.getId());
        if (attempts.isEmpty()) {
            log.warn("Skip knowledge-gap demo seed: no existing attempts to attach answers to");
            return;
        }
        alignDemoAttemptsToRecentWindow(attempts);
        if (quizQuestionRepository.existsByTopic("Thể tích hình nón")) {
            return;
        }
        seedKnowledgeGapFixture(quiz, students, attempts);
        log.info("Seeded knowledge-gap fixture on existing 12A1 attempts without changing scores");
    }

    /**
     * Demo attempts are timestamped once. After a few days they fall out of LAST_7_DAYS and the
     * AC-02 30/40 fixture disappears. Move only stale rows back; scores stay untouched.
     */
    private void alignDemoAttemptsToRecentWindow(List<QuizAttempt> attempts) {
        Instant now = Instant.now();
        Instant oldestAllowed = now.minus(Duration.ofDays(6));
        boolean changed = false;
        for (int index = 0; index < attempts.size(); index++) {
            QuizAttempt attempt = attempts.get(index);
            if (attempt.getSubmittedAt() == null || attempt.getSubmittedAt().isBefore(oldestAllowed)) {
                attempt.setSubmittedAt(now.minus(Duration.ofDays(index % 7)).minus(Duration.ofMinutes(index)));
                changed = true;
            }
        }
        if (changed) {
            quizAttemptRepository.saveAll(attempts);
            log.info("Moved stale demo quiz attempts back into the last 7 days without changing scores");
        }
    }

    private void seedKnowledgeGapFixture(Quiz quiz, List<Student> students, List<QuizAttempt> attempts) {
        if (quizQuestionRepository.existsByTopic("Thể tích hình nón")) {
            return;
        }
        QuizQuestion cone = question(quiz, "Thể tích hình nón", "Thể tích hình nón được tính bằng công thức nào?", 1);
        QuizQuestion asymptote = question(quiz, "Tiệm cận", "Đường tiệm cận đứng của hàm số nằm ở đâu?", 2);
        cone = quizQuestionRepository.save(cone);
        asymptote = quizQuestionRepository.save(asymptote);

        Map<java.util.UUID, List<QuizAttempt>> byStudent = new HashMap<>();
        for (QuizAttempt attempt : attempts) {
            byStudent.computeIfAbsent(attempt.getStudent().getId(), ignored -> new ArrayList<>()).add(attempt);
        }
        for (int fallback = 0; fallback < students.size(); fallback++) {
            Student student = students.get(fallback);
            int index = demoIndex(student, fallback);
            List<QuizAttempt> studentAttempts = byStudent.getOrDefault(student.getId(), List.of());
            for (QuizAttempt attempt : studentAttempts) {
                saveAnswer(attempt, cone, index >= 30);
                saveAnswer(attempt, asymptote, index >= 4);
            }
            if (index < 30) {
                askAboutCone(student);
            }
        }
    }

    private QuizQuestion question(Quiz quiz, String topic, String text, int order) {
        QuizQuestion question = new QuizQuestion();
        question.setQuiz(quiz);
        question.setTopic(topic);
        question.setQuestionText(text);
        question.setOptions(List.of(
                Map.of("key", "A", "text", "Đáp án A"),
                Map.of("key", "B", "text", "Đáp án B")));
        question.setCorrectOptionKey("A");
        question.setOrderIndex(order);
        question.setPoints(1);
        return question;
    }

    private void saveAnswer(QuizAttempt attempt, QuizQuestion question, boolean correct) {
        QuizAttemptAnswer answer = new QuizAttemptAnswer();
        answer.setAttempt(attempt);
        answer.setQuestion(question);
        answer.setSelectedOptionKey(correct ? "A" : "B");
        answer.setCorrect(correct);
        quizAttemptAnswerRepository.save(answer);
    }

    private void askAboutCone(Student student) {
        ChatSession session = new ChatSession();
        session.setStudent(student);
        session.setSubject(SubjectCode.TOAN.name());
        session.setTitle("Hỏi thể tích hình nón");
        session.setStatus(ChatSessionStatus.CLOSED);
        session.setLastMessageAt(Instant.EPOCH);
        session = chatSessionRepository.save(session);

        ChatMessage message = new ChatMessage();
        message.setChatSession(session);
        message.setSenderType(SenderType.STUDENT);
        message.setContent("Em chưa hiểu thể tích hình nón, thầy chữa giúp em với.");
        chatMessageRepository.save(message);
    }

    private int demoIndex(Student student, int fallback) {
        String code = student.getStudentCode();
        if (code != null && code.length() >= 2) {
            try {
                return Integer.parseInt(code.substring(code.length() - 2)) - 1;
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private User persistUser(String username, String email, String fullName, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(DEMO_TEACHER_PASSWORD));
        user.setFullName(fullName);
        user.setGender(role == Role.TEACHER ? Gender.FEMALE : Gender.MALE);
        user.setRole(role);
        user.setActive(true);
        user.setDeleted(false);
        return userRepository.save(user);
    }

    private SchoolClass persistClass(
            String name, String grade, String schoolName, String academicYear, Teacher homeroom) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setName(name);
        schoolClass.setGradeLevel(grade);
        schoolClass.setSchoolName(schoolName);
        schoolClass.setAcademicYear(academicYear);
        schoolClass.setHomeroomTeacher(homeroom);
        return schoolClassRepository.save(schoolClass);
    }

    private void persistAssignment(Teacher teacher, SchoolClass schoolClass, String subject, boolean homeroom) {
        TeacherClassAssignment assignment = new TeacherClassAssignment();
        assignment.setTeacher(teacher);
        assignment.setSchoolClass(schoolClass);
        assignment.setSubject(subject);
        assignment.setHomeroom(homeroom);
        assignmentRepository.save(assignment);
    }
}
