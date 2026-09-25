package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.AnalyticsAccess;
import com.vn.aitutor.service.impl.AnalyticsServiceImpl;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AnalyticsAccessTest {

    @Mock
    private AcademicCalendar academicCalendar;

    @Mock
    private SchoolClassRepository schoolClassRepository;

    @Mock
    private TeacherClassAssignmentRepository assignmentRepository;

    @Mock
    private TeacherRepository teacherRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private AnalyticsAccess analyticsAccess;

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    private AnalyticsAccess access;

    @BeforeEach
    void setUp() {
        access = new AnalyticsAccess(schoolClassRepository, teacherRepository, assignmentRepository);
    }

    @Test
    void summaryRefusesWhenAccessRefuses() {
        UUID classId = UUID.randomUUID();
        UserPrincipal principal = principal(Role.TEACHER);
        when(analyticsAccess.requireReadableClass(principal, classId))
                .thenThrow(new ResourceForbiddenException("Giáo viên không được phân quyền xem lớp học này"));

        assertThrows(
                ResourceForbiddenException.class,
                () -> analyticsService.getSummary(principal, classId, "ALL", ReportPeriod.LAST_7_DAYS, null, null));
    }

    @Test
    void studentCannotReadClass() {
        UUID classId = UUID.randomUUID();
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass(classId)));

        assertThrows(
                ResourceForbiddenException.class,
                () -> access.requireReadableClass(principal(Role.STUDENT), classId));
    }

    @Test
    void teacherCannotReadUnassignedClass() {
        UUID classId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        UserPrincipal principal = principal(Role.TEACHER);
        Teacher teacher = new Teacher();
        teacher.setId(teacherId);
        teacher.setUser(principal.getUsers());

        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass(classId)));
        when(teacherRepository.findByUserId(principal.getUsers().getId())).thenReturn(Optional.of(teacher));
        when(assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(teacherId, classId)).thenReturn(false);

        assertThrows(ResourceForbiddenException.class, () -> access.requireReadableClass(principal, classId));
    }

    @Test
    void adminCanReadAnyClass() {
        UUID classId = UUID.randomUUID();
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass(classId)));

        SchoolClass loaded = access.requireReadableClass(principal(Role.ADMIN), classId);
        assertEquals(classId, loaded.getId());
    }

    @Test
    void missingClassIsNotFound() {
        UUID classId = UUID.randomUUID();
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> access.requireReadableClass(principal(Role.ADMIN), classId));
    }

    private static UserPrincipal principal(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        user.setFullName("Nguyễn Thị Giáo");
        return UserPrincipal.builder().users(user).build();
    }

    private static SchoolClass schoolClass(UUID classId) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(classId);
        schoolClass.setName("12A1");
        return schoolClass;
    }
}
