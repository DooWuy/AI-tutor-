package com.vn.aitutor.service.classroom;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.response.classroom.TeacherClassResponse;
import com.vn.aitutor.service.analytics.AnalyticsAccess;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.TeacherClassAssignment;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TeacherClassServiceTest {

    @Mock private AnalyticsAccess analyticsAccess;
    @Mock private SchoolClassRepository schoolClassRepository;
    @Mock private TeacherRepository teacherRepository;
    @Mock private TeacherClassAssignmentRepository assignmentRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private ITeacherStudentService teacherStudentService;
    @Mock private QuizRepository quizRepository;
    @Mock private QuizQuestionRepository quizQuestionRepository;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @InjectMocks private TeacherClassService service;

    @Test
    void teacherCannotOpenAnUnassignedClass() {
        UUID classId = UUID.randomUUID();
        UserPrincipal principal = principal();
        when(analyticsAccess.requireReadableClass(principal, classId))
                .thenThrow(new ResourceForbiddenException("Giáo viên không được phân quyền xem lớp học này"));

        assertThrows(ResourceForbiddenException.class, () -> service.get(principal, classId));
    }

    @Test
    void teacherClassesCollapseMultipleSubjects() {
        UUID classId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        UserPrincipal principal = principal();
        Teacher teacher = new Teacher();
        teacher.setId(teacherId);
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(classId);
        schoolClass.setName("12A1");
        schoolClass.setGradeLevel("12");
        schoolClass.setAcademicYear("2025-2026");
        schoolClass.setSchoolName("AI Tutor");
        TeacherClassAssignment math = new TeacherClassAssignment();
        math.setSchoolClass(schoolClass);
        math.setSubject("TOAN");
        math.setHomeroom(true);
        TeacherClassAssignment physics = new TeacherClassAssignment();
        physics.setSchoolClass(schoolClass);
        physics.setSubject("LY");
        when(teacherRepository.findByUserId(principal.getUsers().getId())).thenReturn(Optional.of(teacher));
        when(assignmentRepository.findByTeacherIdWithClass(teacherId)).thenReturn(List.of(math, physics));
        when(studentRepository.countRosterByClassId(classId)).thenReturn(40L);

        var classes = service.list(principal);

        assertEquals(1, classes.size());
        assertEquals("12A1", classes.get(0).getName());
        assertEquals(40, classes.get(0).getStudentCount());
        assertTrue(classes.get(0).isHomeroom());
        assertTrue(classes.get(0).getSubject().contains("Toán"));
        assertTrue(classes.get(0).getSubject().contains("Vật lý"));
    }

    private UserPrincipal principal() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.TEACHER);
        return UserPrincipal.builder().users(user).build();
    }
}
