package com.vn.aitutor.service.classroom;

import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.user.StudentAdminListItemResponse;
import com.vn.aitutor.dto.response.classroom.TeacherClassQuizResponse;
import com.vn.aitutor.dto.response.classroom.TeacherClassResponse;
import com.vn.aitutor.service.analytics.AnalyticsAccess;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.TeacherClassAssignment;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherClassService {

    private final AnalyticsAccess analyticsAccess;
    private final SchoolClassRepository schoolClassRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;
    private final ITeacherStudentService teacherStudentService;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public List<TeacherClassResponse> list(UserPrincipal principal) {
        User user = requireUser(principal);
        if (user.getRole() == Role.ADMIN) {
            return schoolClassRepository.findAllOrdered().stream().map(this::adminRow).toList();
        }
        Teacher teacher = requireTeacher(user);
        Map<UUID, List<TeacherClassAssignment>> byClass = new LinkedHashMap<>();
        for (TeacherClassAssignment assignment : assignmentRepository.findByTeacherIdWithClass(teacher.getId())) {
            byClass.computeIfAbsent(assignment.getSchoolClass().getId(), ignored -> new ArrayList<>()).add(assignment);
        }
        return byClass.values().stream()
                .map(rows -> toResponse(rows.get(0).getSchoolClass(), rows))
                .sorted(Comparator.comparing(TeacherClassResponse::getGradeLevel, Comparator.nullsLast(String::compareTo))
                        .thenComparing(TeacherClassResponse::getName, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    public TeacherClassResponse get(UserPrincipal principal, UUID classId) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, classId);
        User user = requireUser(principal);
        if (user.getRole() == Role.ADMIN) {
            return adminRow(schoolClass);
        }
        Teacher teacher = requireTeacher(user);
        return toResponse(schoolClass, assignmentRepository.findByTeacherAndClass(teacher.getId(), classId));
    }

    public PageResponseDTO<StudentAdminListItemResponse> students(
            UserPrincipal principal, UUID classId, String search, PageRequest pageRequest) {
        analyticsAccess.requireReadableClass(principal, classId);
        return teacherStudentService.searchStudents(requireUser(principal).getId(), classId, search, pageRequest);
    }

    public List<TeacherClassQuizResponse> quizzes(UserPrincipal principal, UUID classId) {
        analyticsAccess.requireReadableClass(principal, classId);
        User user = requireUser(principal);
        UUID ownerId = user.getRole() == Role.ADMIN ? null : user.getId();
        List<Quiz> quizzes = quizRepository.findPublishedAssignedToClass(classId, ownerId);
        if (quizzes.isEmpty()) {
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
                        .build())
                .toList();
    }

    private TeacherClassResponse adminRow(SchoolClass schoolClass) {
        return TeacherClassResponse.builder()
                .id(schoolClass.getId())
                .name(schoolClass.getName())
                .gradeLevel(schoolClass.getGradeLevel())
                .schoolName(schoolClass.getSchoolName())
                .academicYear(schoolClass.getAcademicYear())
                .homeroom(schoolClass.getHomeroomTeacher() != null)
                .studentCount((int) studentRepository.countRosterByClassId(schoolClass.getId()))
                .build();
    }

    private TeacherClassResponse toResponse(SchoolClass schoolClass, List<TeacherClassAssignment> assignments) {
        String subject = assignments.stream()
                .map(TeacherClassAssignment::getSubject)
                .map(this::subjectLabel)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.joining(", "));
        boolean homeroom = assignments.stream().anyMatch(TeacherClassAssignment::isHomeroom);
        return TeacherClassResponse.builder()
                .id(schoolClass.getId())
                .name(schoolClass.getName())
                .gradeLevel(schoolClass.getGradeLevel())
                .schoolName(schoolClass.getSchoolName())
                .academicYear(schoolClass.getAcademicYear())
                .subject(subject.isBlank() ? null : subject)
                .homeroom(homeroom)
                .studentCount((int) studentRepository.countRosterByClassId(schoolClass.getId()))
                .build();
    }

    private String subjectLabel(String subject) {
        if (subject == null || subject.isBlank()) {
            return null;
        }
        try {
            return SubjectCode.parseRequired(subject).getDisplayName();
        } catch (RuntimeException ex) {
            return subject.trim();
        }
    }

    private Map<UUID, Long> counts(List<Object[]> rows) {
        Map<UUID, Long> map = new LinkedHashMap<>();
        if (rows == null) {
            return map;
        }
        for (Object[] row : rows) {
            map.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private Teacher requireTeacher(User user) {
        return teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceForbiddenException("Tài khoản không gắn với hồ sơ giáo viên"));
    }

    private User requireUser(UserPrincipal principal) {
        if (principal == null || principal.getUsers() == null) {
            throw new ResourceForbiddenException("Không xác định được người dùng");
        }
        User user = principal.getUsers();
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.TEACHER) {
            throw new ResourceForbiddenException("Bạn không có quyền xem lớp học");
        }
        return user;
    }
}
