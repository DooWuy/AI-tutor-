package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.impl.AnalyticsServiceImpl;
import java.util.Optional;
import java.util.UUID;
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

    @InjectMocks
    private AnalyticsServiceImpl analyticsService;

    @Test
    void teacherCannotReadUnassignedClass() {
        UUID classId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);
        user.setRole(Role.TEACHER);
        UserPrincipal principal = UserPrincipal.builder().users(user).build();

        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(classId);
        schoolClass.setName("12A9");

        Teacher teacher = new Teacher();
        teacher.setId(teacherId);
        teacher.setUser(user);

        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass));
        when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
        when(assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(teacherId, classId)).thenReturn(false);

        assertThrows(
                ResourceForbiddenException.class,
                () -> analyticsService.getSummary(principal, classId, "ALL", ReportPeriod.LAST_7_DAYS, null, null));
    }
}
