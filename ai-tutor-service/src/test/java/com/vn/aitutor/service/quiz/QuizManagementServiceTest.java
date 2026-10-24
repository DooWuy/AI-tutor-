package com.vn.aitutor.service.quiz;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.request.quiz.QuizGenerateRequest;
import com.vn.aitutor.dto.response.quiz.QuizResponse;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizClassAssignment;
import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.quiz.ChoiceInput;
import com.vn.aitutor.quiz.NormalizedQuestion;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizClassAssignmentRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.QuizStudyClassAssignmentRepository;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudyClassRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.quiz.QuestionComposer.ComposeRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuizManagementServiceTest {

    @Mock private QuizRepository quizRepository;
    @Mock private QuizQuestionRepository quizQuestionRepository;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private LessonRepository lessonRepository;
    @Mock private UserRepository userRepository;
    @Mock private QuestionBankService questionBankService;
    @Mock private QuestionComposer questionComposer;
    @Mock private QuizAccess quizAccess;
    @Mock private SchoolClassRepository schoolClassRepository;
    @Mock private TeacherRepository teacherRepository;
    @Mock private TeacherClassAssignmentRepository assignmentRepository;
    @Mock private QuizClassAssignmentRepository quizClassAssignmentRepository;
    @Mock private QuizStudyClassAssignmentRepository quizStudyClassAssignmentRepository;
    @Mock private StudyClassRepository studyClassRepository;
    @Mock private Clock learningClock;

    private QuizManagementService service;
    private Quiz quiz;

    @BeforeEach
    void setUp() {
        service = new QuizManagementService(
                quizRepository,
                quizQuestionRepository,
                quizAttemptRepository,
                questionBankRepository,
                lessonRepository,
                userRepository,
                questionBankService,
                questionComposer,
                quizAccess,
                schoolClassRepository,
                teacherRepository,
                assignmentRepository,
                quizClassAssignmentRepository,
                quizStudyClassAssignmentRepository,
                studyClassRepository,
                learningClock);
        quiz = new Quiz();
        quiz.setId(UUID.randomUUID());
        quiz.setTitle("Đề kiểm tra");
        quiz.setSubject("TOAN");
        quiz.setGradeLevel("12");
    }

    @Test
    void multiSelectCountIsPartOfTheRatio() {
        when(quizAccess.require(quiz.getId(), null)).thenReturn(quiz);
        QuizGenerateRequest request = request(5, 3, 1, 1, 0);

        service.validateGenerate(quiz.getId(), request, null);

        QuizGenerateRequest over = request(5, 3, 1, 1, 1);
        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class,
                () -> service.validateGenerate(quiz.getId(), over, null));
        assertEquals("Tổng tỷ lệ loại câu phải bằng số lượng câu hỏi", error.getMessage());
    }

    @Test
    void missingMultiSelectCountCountsAsZero() {
        when(quizAccess.require(quiz.getId(), null)).thenReturn(quiz);
        QuizGenerateRequest request = request(5, 3, null, 1, 1);

        service.validateGenerate(quiz.getId(), request, null);
    }

    @Test
    void publishRequiresAtLeastOneClass() {
        UserPrincipal teacher = principal(Role.TEACHER);
        when(quizAccess.require(quiz.getId(), teacher)).thenReturn(quiz);
        when(quizQuestionRepository.countByQuizId(quiz.getId())).thenReturn(1L);

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class,
                () -> service.publish(quiz.getId(), List.of(), teacher));

        assertEquals("Chọn ít nhất một lớp để phát hành", error.getMessage());
        verify(quizClassAssignmentRepository, never()).deleteByQuizId(any());
    }

    @Test
    void teacherCannotPublishToAnUnassignedClass() {
        UserPrincipal teacher = principal(Role.TEACHER);
        UUID classId = UUID.randomUUID();
        Teacher profile = new Teacher();
        profile.setId(UUID.randomUUID());
        SchoolClass schoolClass = schoolClass(classId, "12");
        when(quizAccess.require(quiz.getId(), teacher)).thenReturn(quiz);
        when(quizQuestionRepository.countByQuizId(quiz.getId())).thenReturn(1L);
        when(teacherRepository.findByUserId(teacher.getUsers().getId())).thenReturn(Optional.of(profile));
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass));
        when(assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(profile.getId(), classId)).thenReturn(false);

        assertThrows(ResourceForbiddenException.class, () -> service.publish(quiz.getId(), List.of(classId), teacher));
        verify(quizRepository, never()).save(any());
    }

    @Test
    void teacherCannotPublishToADifferentGrade() {
        UserPrincipal teacher = principal(Role.TEACHER);
        UUID classId = UUID.randomUUID();
        Teacher profile = new Teacher();
        profile.setId(UUID.randomUUID());
        when(quizAccess.require(quiz.getId(), teacher)).thenReturn(quiz);
        when(quizQuestionRepository.countByQuizId(quiz.getId())).thenReturn(1L);
        when(teacherRepository.findByUserId(teacher.getUsers().getId())).thenReturn(Optional.of(profile));
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass(classId, "10")));
        when(assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(profile.getId(), classId)).thenReturn(true);

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class,
                () -> service.publish(quiz.getId(), List.of(classId), teacher));
        assertEquals("Lớp không cùng khối với đề thi", error.getMessage());
    }

    @Test
    void missingClassIsNotFound() {
        UserPrincipal admin = principal(Role.ADMIN);
        UUID classId = UUID.randomUUID();
        when(quizAccess.require(quiz.getId(), admin)).thenReturn(quiz);
        when(quizQuestionRepository.countByQuizId(quiz.getId())).thenReturn(1L);
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.publish(quiz.getId(), List.of(classId), admin));
    }

    @Test
    void publishReplacesClassAssignments() {
        UserPrincipal teacher = principal(Role.TEACHER);
        UUID classId = UUID.randomUUID();
        Teacher profile = new Teacher();
        profile.setId(UUID.randomUUID());
        SchoolClass schoolClass = schoolClass(classId, "12");
        schoolClass.setName("12A1");
        QuizClassAssignment stored = new QuizClassAssignment();
        stored.setQuiz(quiz);
        stored.setSchoolClass(schoolClass);
        when(quizAccess.require(quiz.getId(), teacher)).thenReturn(quiz);
        when(quizQuestionRepository.countByQuizId(quiz.getId())).thenReturn(1L);
        when(teacherRepository.findByUserId(teacher.getUsers().getId())).thenReturn(Optional.of(profile));
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass));
        when(assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(profile.getId(), classId)).thenReturn(true);
        when(userRepository.getReferenceById(teacher.getUsers().getId())).thenReturn(teacher.getUsers());
        when(quizRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId())).thenReturn(List.of());
        when(quizAttemptRepository.countByQuizId(quiz.getId())).thenReturn(0L);
        when(quizClassAssignmentRepository.findByQuizIdIn(any())).thenReturn(List.of(stored));

        QuizResponse published = service.publish(quiz.getId(), List.of(classId), teacher);

        verify(quizClassAssignmentRepository).deleteByQuizId(quiz.getId());
        verify(quizClassAssignmentRepository).save(any(QuizClassAssignment.class));
        assertEquals("PUBLISHED", published.getStatus());
        assertEquals("12A1", published.getClasses().get(0).getName());
    }

    @Test
    void publishRejectsEndBeforeStart() {
        UserPrincipal teacher = principal(Role.TEACHER);
        UUID classId = UUID.randomUUID();
        Teacher profile = new Teacher();
        profile.setId(UUID.randomUUID());
        when(quizAccess.require(quiz.getId(), teacher)).thenReturn(quiz);
        when(quizQuestionRepository.countByQuizId(quiz.getId())).thenReturn(1L);
        when(teacherRepository.findByUserId(teacher.getUsers().getId())).thenReturn(Optional.of(profile));
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass(classId, "12")));
        when(assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(profile.getId(), classId)).thenReturn(true);
        Instant start = Instant.parse("2026-10-20T01:00:00Z");
        Instant end = Instant.parse("2026-10-19T01:00:00Z");

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class,
                () -> service.publish(quiz.getId(), List.of(classId), List.of(), start, end, teacher));

        assertEquals("Thời gian kết thúc phải sau thời gian bắt đầu", error.getMessage());
        verify(quizClassAssignmentRepository, never()).deleteByQuizId(any());
    }

    @Test
    void publishStoresAvailabilityWindow() {
        UserPrincipal teacher = principal(Role.TEACHER);
        UUID classId = UUID.randomUUID();
        Teacher profile = new Teacher();
        profile.setId(UUID.randomUUID());
        SchoolClass schoolClass = schoolClass(classId, "12");
        schoolClass.setName("12A1");
        QuizClassAssignment stored = new QuizClassAssignment();
        stored.setQuiz(quiz);
        stored.setSchoolClass(schoolClass);
        when(quizAccess.require(quiz.getId(), teacher)).thenReturn(quiz);
        when(quizQuestionRepository.countByQuizId(quiz.getId())).thenReturn(1L);
        when(teacherRepository.findByUserId(teacher.getUsers().getId())).thenReturn(Optional.of(profile));
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass));
        when(assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(profile.getId(), classId)).thenReturn(true);
        when(userRepository.getReferenceById(teacher.getUsers().getId())).thenReturn(teacher.getUsers());
        when(quizRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId())).thenReturn(List.of());
        when(quizAttemptRepository.countByQuizId(quiz.getId())).thenReturn(0L);
        when(quizClassAssignmentRepository.findByQuizIdIn(any())).thenReturn(List.of(stored));
        Instant start = Instant.parse("2026-10-20T01:00:00Z");
        Instant end = Instant.parse("2026-10-20T03:30:00Z");

        QuizResponse published = service.publish(quiz.getId(), List.of(classId), List.of(), start, end, teacher);

        assertEquals(start, published.getAvailableFrom());
        assertEquals(end, published.getAvailableUntil());
    }

    @Test
    void archiveKeepsClassAssignments() {
        when(quizAccess.require(quiz.getId(), null)).thenReturn(quiz);
        when(quizRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId())).thenReturn(List.of());
        when(quizAttemptRepository.countByQuizId(quiz.getId())).thenReturn(0L);

        service.archive(quiz.getId(), null);

        verify(quizClassAssignmentRepository, never()).deleteByQuizId(any());
        assertEquals(com.vn.aitutor.entity.enums.QuizStatus.ARCHIVED, quiz.getStatus());
    }

    @Test
    void generateAsksForFourChoicesWhenTheRatioIncludesMultiSelect() {
        when(quizAccess.require(quiz.getId(), null)).thenReturn(quiz);
        when(quizQuestionRepository.maxOrderIndex(quiz.getId())).thenReturn(0);
        when(quizQuestionRepository.findSourceIds(quiz.getId())).thenReturn(List.of());
        when(questionBankRepository.findActiveForQuiz(any(), anyInt(), anyInt(), any(), any(), anyBoolean(), any()))
                .thenReturn(List.of());
        when(questionComposer.compose(any())).thenReturn(List.of(draft()));
        when(quizRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(quizQuestionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId())).thenReturn(List.of());

        service.generate(quiz.getId(), request(1, 0, 1, 0, 0), null);

        ArgumentCaptor<ComposeRequest> compose = ArgumentCaptor.forClass(ComposeRequest.class);
        verify(questionComposer).compose(compose.capture());
        assertEquals(QuestionType.MULTI_SELECT, compose.getValue().type());
        assertEquals(4, compose.getValue().exactChoiceCount());
        assertEquals(1, compose.getValue().count());

        ArgumentCaptor<QuizQuestion> saved = ArgumentCaptor.forClass(QuizQuestion.class);
        verify(quizQuestionRepository).save(saved.capture());
        assertEquals(QuestionType.MULTI_SELECT, saved.getValue().getQuestionType());
        assertEquals("A,C", saved.getValue().getCorrectOptionKey());
        assertEquals("Đúng", saved.getValue().getOptions().get(0).get("content"));
    }

    private UserPrincipal principal(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        return UserPrincipal.builder().users(user).build();
    }

    private SchoolClass schoolClass(UUID id, String grade) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(id);
        schoolClass.setGradeLevel(grade);
        schoolClass.setName("Lớp " + grade);
        return schoolClass;
    }

    private QuizGenerateRequest request(int count, int multipleChoice, Integer multiSelect, int trueFalse, int fillBlank) {
        QuizGenerateRequest request = new QuizGenerateRequest();
        request.setTopic("Hàm số");
        request.setCount(count);
        request.setMinDifficulty(2);
        request.setMaxDifficulty(4);
        request.setMultipleChoice(multipleChoice);
        request.setMultiSelect(multiSelect);
        request.setTrueFalse(trueFalse);
        request.setFillBlank(fillBlank);
        return request;
    }

    private NormalizedQuestion draft() {
        return new NormalizedQuestion(
                "Chọn các đáp án đúng",
                "A và C đúng.",
                3,
                QuestionType.MULTI_SELECT,
                List.of("đại số"),
                List.of(
                        new ChoiceInput("A", "Đúng", true),
                        new ChoiceInput("B", "Sai", false),
                        new ChoiceInput("C", "Cũng đúng", true)),
                null);
    }
}
