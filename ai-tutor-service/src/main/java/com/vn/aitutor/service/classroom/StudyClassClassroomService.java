package com.vn.aitutor.service.classroom;

import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.StudentPublishedQuizResponse;
import com.vn.aitutor.dto.response.StudentSchoolClassCard;
import com.vn.aitutor.dto.response.StudentStudyClassCard;
import com.vn.aitutor.dto.response.classroom.TeacherClassQuizResponse;
import com.vn.aitutor.dto.response.user.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.user.StudentAdminListItemResponse;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizAttempt;
import com.vn.aitutor.entity.QuizClassAssignment;
import com.vn.aitutor.entity.QuizStudyClassAssignment;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.StudyClass;
import com.vn.aitutor.entity.StudyClassEnrollment;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.StudyClassStatus;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizClassAssignmentRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.QuizStudyClassAssignmentRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.StudyClassEnrollmentRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.quiz.PublishWindow;
import com.vn.aitutor.service.user.IAdminStudentService;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class StudyClassClassroomService {

    private final StudyClassService studyClassService;
    private final StudyClassEnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final ITeacherStudentService teacherStudentService;
    private final IAdminStudentService adminStudentService;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizClassAssignmentRepository schoolAssignments;
    private final QuizStudyClassAssignmentRepository studyAssignments;
    private final Clock learningClock;

    @Transactional
    public PageResponseDTO<StudentAdminListItemResponse> students(
            UserPrincipal principal, UUID classId, String search, PageRequest pageRequest) {
        studyClassService.owned(principal, classId);
        Page<Student> page = enrollmentRepository.searchApproved(classId, blankToNull(search), bounded(pageRequest));
        List<StudentAdminListItemResponse> items = page.getContent().stream().map(teacherStudentService::toRosterItem).toList();
        return PageResponseDTO.<StudentAdminListItemResponse>builder()
                .content(items)
                .page(page.getNumber() + 1)
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }

    @Transactional
    public ApiResponse<StudentAdminDetailResponse> studentDetail(UserPrincipal principal, UUID classId, UUID studentId) {
        studyClassService.owned(principal, classId);
        StudyClassEnrollment enrollment = enrollmentRepository.findByStudyClass_IdAndStudent_Id(classId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Học sinh không thuộc lớp học thêm này"));
        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new ResourceNotFoundException("Học sinh không thuộc lớp học thêm này");
        }
        return adminStudentService.getStudentDetail(studentId);
    }

    @Transactional
    public List<TeacherClassQuizResponse> quizzes(UserPrincipal principal, UUID classId) {
        studyClassService.owned(principal, classId);
        User user = principal.getUsers();
        List<Quiz> quizzes = quizRepository.findPublishedAssignedToStudyClass(classId, user.getId());
        if (quizzes == null || quizzes.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = quizzes.stream().map(Quiz::getId).toList();
        Map<UUID, Long> questions = counts(quizQuestionRepository.countGrouped(ids));
        Map<UUID, Long> attempts = counts(quizAttemptRepository.countGrouped(ids));
        return quizzes.stream()
                .map(quiz -> TeacherClassQuizResponse.builder()
                        .id(quiz.getId())
                        .title(quiz.getTitle())
                        .subject(quiz.getSubject())
                        .gradeLevel(quiz.getGradeLevel())
                        .questionCount(questions.getOrDefault(quiz.getId(), 0L).intValue())
                        .attemptCount(attempts.getOrDefault(quiz.getId(), 0L))
                        .timeLimitMinutes(quiz.getTimeLimit() == null ? 30 : quiz.getTimeLimit())
                        .availableFrom(quiz.getAvailableFrom())
                        .availableUntil(quiz.getAvailableUntil())
                        .build())
                .toList();
    }

    @Transactional
    public StudentSchoolClassCard schoolClass(UserPrincipal principal) {
        Student student = loadStudent(principal);
        SchoolClass schoolClass = student.getClassEntity();
        if (schoolClass == null) {
            return null;
        }
        return StudentSchoolClassCard.builder()
                .id(schoolClass.getId())
                .name(schoolClass.getName())
                .gradeLevel(schoolClass.getGradeLevel())
                .schoolName(schoolClass.getSchoolName())
                .academicYear(schoolClass.getAcademicYear())
                .build();
    }

    @Transactional
    public List<StudentPublishedQuizResponse> publishedQuizzes(UserPrincipal principal) {
        Student student = loadStudent(principal);
        UUID classId = student.getClassEntity() == null ? null : student.getClassEntity().getId();
        List<Quiz> quizzes = quizRepository.findPublishedForStudent(classId, student.getId());
        if (quizzes == null || quizzes.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = quizzes.stream().map(Quiz::getId).toList();
        Map<UUID, List<String>> classNames = classNames(student, ids);
        Set<UUID> viaStudyClass = studyQuizIds(ids, approvedStudyClassIds(student.getId()));
        Map<UUID, Long> questions = counts(quizQuestionRepository.countGrouped(ids));
        Map<UUID, QuizAttempt> attempts = latestAttempts(student.getId(), ids);
        Instant now = learningClock.instant();
        List<StudentPublishedQuizResponse> rows = new ArrayList<>();
        for (Quiz quiz : quizzes) {
            boolean studyVisible = viaStudyClass.contains(quiz.getId());
            if (!studyVisible && !matchesGrade(quiz, student)) {
                continue;
            }
            QuizAttempt attempt = attempts.get(quiz.getId());
            String phase = PublishWindow.phase(quiz.getAvailableFrom(), quiz.getAvailableUntil(), now);
            List<String> names = classNames.getOrDefault(quiz.getId(), List.of());
            rows.add(StudentPublishedQuizResponse.builder()
                    .id(quiz.getId())
                    .title(quiz.getTitle())
                    .subject(quiz.getSubject())
                    .questionCount(questions.getOrDefault(quiz.getId(), 0L).intValue())
                    .timeLimitMinutes(quiz.getTimeLimit() == null ? 30 : quiz.getTimeLimit())
                    .availableFrom(quiz.getAvailableFrom())
                    .availableUntil(quiz.getAvailableUntil())
                    .phase(phase)
                    .classNames(names.isEmpty() ? "Lớp của bạn" : String.join(", ", names))
                    .teacherName(quiz.getCreatedBy() == null ? null : quiz.getCreatedBy().getFullName())
                    .attemptId(attempt == null ? null : attempt.getId())
                    .score(attempt == null ? null : attempt.getScore())
                    .submittedAt(attempt == null ? null : attempt.getSubmittedAt())
                    .canStart(PublishWindow.OPEN.equals(phase))
                    .canReview(attempt != null)
                    .build());
        }
        return rows;
    }

    @Transactional
    public List<StudentStudyClassCard> myClasses(UserPrincipal principal) {
        Student student = loadStudent(principal);
        List<StudyClassEnrollment> enrollments = enrollmentRepository.findMine(student.getId());
        List<StudentStudyClassCard> cards = new ArrayList<>();
        for (StudyClassEnrollment enrollment : enrollments) {
            StudyClass studyClass = enrollment.getStudyClass();
            boolean open = enrollment.getStatus() == EnrollmentStatus.APPROVED
                    && studyClass.getStatus() == StudyClassStatus.ACTIVE;
            List<Quiz> quizzes = open ? quizRepository.findPublishedForActiveStudyClass(studyClass.getId()) : List.of();
            cards.add(StudentStudyClassCard.builder()
                    .enrollmentId(enrollment.getId())
                    .enrollmentStatus(enrollment.getStatus())
                    .requestedAt(enrollment.getRequestedAt())
                    .reviewedAt(enrollment.getReviewedAt())
                    .classId(studyClass.getId())
                    .name(studyClass.getName())
                    .className(studyClass.getName())
                    .description(studyClass.getDescription())
                    .classCode(studyClass.getClassCode())
                    .classStatus(studyClass.getStatus())
                    .teacherName(teacherName(studyClass))
                    .startDate(studyClass.getStartDate())
                    .endDate(studyClass.getEndDate())
                    .maxStudents(studyClass.getMaxStudents())
                    .approvedCount((int) enrollmentRepository.countByStudyClass_IdAndStatus(
                            studyClass.getId(), EnrollmentStatus.APPROVED))
                    .quizzes(quizzes.stream().map(this::publishedQuiz).toList())
                    .build());
        }
        return cards;
    }

    private Student loadStudent(UserPrincipal principal) {
        User user = principal.getUsers();
        if (user == null || user.getRole() != Role.STUDENT) {
            throw new ResourceForbiddenException("Chỉ học sinh xem lớp học của mình");
        }
        studyClassService.dissolveExpired();
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ học sinh"));
    }

    private Map<UUID, List<String>> classNames(Student student, List<UUID> quizIds) {
        Map<UUID, List<String>> names = new HashMap<>();
        SchoolClass schoolClass = student.getClassEntity();
        if (schoolClass != null) {
            List<QuizClassAssignment> schoolRows = schoolAssignments.findByQuizIdIn(quizIds);
            if (schoolRows != null) {
                for (QuizClassAssignment row : schoolRows) {
                    if (row.getQuiz() == null || row.getSchoolClass() == null) {
                        continue;
                    }
                    if (schoolClass.getId().equals(row.getSchoolClass().getId())) {
                        names.computeIfAbsent(row.getQuiz().getId(), ignored -> new ArrayList<>())
                                .add(row.getSchoolClass().getName());
                    }
                }
            }
        }
        Map<UUID, String> studyNames = approvedStudyNames(student.getId());
        List<QuizStudyClassAssignment> studyRows = studyAssignments.findByQuizIdIn(quizIds);
        if (studyRows != null) {
            for (QuizStudyClassAssignment row : studyRows) {
                if (row.getQuiz() == null || row.getStudyClass() == null) {
                    continue;
                }
                String name = studyNames.get(row.getStudyClass().getId());
                if (name != null) {
                    names.computeIfAbsent(row.getQuiz().getId(), ignored -> new ArrayList<>()).add(name);
                }
            }
        }
        return names;
    }

    private Set<UUID> studyQuizIds(List<UUID> quizIds, Set<UUID> studyClassIds) {
        Set<UUID> visible = new HashSet<>();
        if (studyClassIds.isEmpty()) {
            return visible;
        }
        List<QuizStudyClassAssignment> rows = studyAssignments.findByQuizIdIn(quizIds);
        if (rows == null) {
            return visible;
        }
        for (QuizStudyClassAssignment row : rows) {
            if (row.getQuiz() != null && row.getStudyClass() != null && studyClassIds.contains(row.getStudyClass().getId())) {
                visible.add(row.getQuiz().getId());
            }
        }
        return visible;
    }

    private Map<UUID, String> approvedStudyNames(UUID studentId) {
        Map<UUID, String> names = new HashMap<>();
        for (StudyClassEnrollment enrollment : enrollmentRepository.findMine(studentId)) {
            StudyClass studyClass = enrollment.getStudyClass();
            if (enrollment.getStatus() == EnrollmentStatus.APPROVED && studyClass.getStatus() == StudyClassStatus.ACTIVE) {
                names.put(studyClass.getId(), studyClass.getName());
            }
        }
        return names;
    }

    private Set<UUID> approvedStudyClassIds(UUID studentId) {
        return approvedStudyNames(studentId).keySet();
    }

    private Map<UUID, QuizAttempt> latestAttempts(UUID studentId, List<UUID> quizIds) {
        Map<UUID, QuizAttempt> latest = new HashMap<>();
        List<QuizAttempt> rows = quizAttemptRepository.findSubmittedForStudent(studentId, quizIds);
        if (rows == null) {
            return latest;
        }
        for (QuizAttempt attempt : rows) {
            if (attempt.getQuiz() != null) {
                latest.putIfAbsent(attempt.getQuiz().getId(), attempt);
            }
        }
        return latest;
    }

    private boolean matchesGrade(Quiz quiz, Student student) {
        if (quiz.getGradeLevel() == null || quiz.getGradeLevel().isBlank()) {
            return true;
        }
        if (quiz.getGradeLevel().equals(student.getGradeLevel())) {
            return true;
        }
        return student.getClassEntity() != null && quiz.getGradeLevel().equals(student.getClassEntity().getGradeLevel());
    }

    private StudentStudyClassCard.PublishedQuiz publishedQuiz(Quiz quiz) {
        return StudentStudyClassCard.PublishedQuiz.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .subject(quiz.getSubject())
                .questionCount((int) quizQuestionRepository.countByQuizId(quiz.getId()))
                .timeLimitMinutes(quiz.getTimeLimit() == null ? 30 : quiz.getTimeLimit())
                .build();
    }

    private String teacherName(StudyClass studyClass) {
        if (studyClass.getTeacher() == null || studyClass.getTeacher().getUser() == null) {
            return null;
        }
        return studyClass.getTeacher().getUser().getFullName();
    }

    private PageRequest bounded(PageRequest request) {
        Sort.Order order = request.getSort().stream().findFirst().orElse(Sort.Order.asc("fullName"));
        String property = switch (order.getProperty()) {
            case "fullName" -> "u.full_name";
            case "createdAt" -> "u.created_at";
            case "totalXp" -> "s.total_xp";
            case "lastActivityDate" -> "s.last_activity_date";
            default -> "u.full_name";
        };
        return PageRequest.of(
                Math.max(0, request.getPageNumber()),
                Math.min(Math.max(1, request.getPageSize()), 50),
                Sort.by(order.getDirection(), property));
    }

    private Map<UUID, Long> counts(List<Object[]> rows) {
        Map<UUID, Long> map = new java.util.HashMap<>();
        if (rows == null) {
            return map;
        }
        for (Object[] row : rows) {
            map.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
