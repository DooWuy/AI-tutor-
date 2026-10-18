package com.vn.aitutor.service.classroom;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.TeacherClassAssignment;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.user.IAdminStudentService;
import com.vn.aitutor.service.gamification.StreakService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TeacherStudentServiceTest {
    @Mock private TeacherRepository teacherRepository;
    @Mock private TeacherClassAssignmentRepository assignmentRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private IAdminStudentService adminStudentService;
    @org.mockito.Spy private StreakService streaks = new StreakService(java.time.Clock.systemUTC(), java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
    @Mock private UserRepository userRepository;
    @Mock private SchoolClassRepository schoolClassRepository;
    @InjectMocks private TeacherStudentServiceImpl service;

    @Test
    void teacherCannotReadStudentOutsideAssignedClass() {
        UUID teacherUserId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        UUID assignedClassId = UUID.randomUUID();
        UUID otherClassId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        Teacher teacher = new Teacher();
        teacher.setId(teacherId);
        SchoolClass assigned = new SchoolClass();
        assigned.setId(assignedClassId);
        TeacherClassAssignment assignment = new TeacherClassAssignment();
        assignment.setSchoolClass(assigned);
        Student student = new Student();
        student.setId(studentId);
        SchoolClass other = new SchoolClass();
        other.setId(otherClassId);
        student.setClassEntity(other);
        when(teacherRepository.findByUserId(teacherUserId)).thenReturn(Optional.of(teacher));
        when(studentRepository.findActiveStudentWithUserById(studentId)).thenReturn(Optional.of(student));
        when(assignmentRepository.findByTeacherIdWithClass(teacherId)).thenReturn(List.of(assignment));

        assertThrows(ResourceForbiddenException.class,
                () -> service.getStudentDetail(teacherUserId, studentId));
    }

    @Test
    void teacherCannotSearchStudentOutsideAssignedClass() {
        UUID teacherUserId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        UUID assignedClassId = UUID.randomUUID();
        UUID otherClassId = UUID.randomUUID();
        User user = new User();
        user.setId(teacherUserId);
        user.setRole(Role.TEACHER);
        Teacher teacher = new Teacher();
        teacher.setId(teacherId);
        SchoolClass assigned = new SchoolClass();
        assigned.setId(assignedClassId);
        TeacherClassAssignment assignment = new TeacherClassAssignment();
        assignment.setSchoolClass(assigned);
        when(userRepository.findById(teacherUserId)).thenReturn(Optional.of(user));
        when(teacherRepository.findByUserId(teacherUserId)).thenReturn(Optional.of(teacher));
        when(assignmentRepository.findByTeacherIdWithClass(teacherId)).thenReturn(List.of(assignment));

        assertThrows(ResourceForbiddenException.class,
                () -> service.searchStudents(teacherUserId, otherClassId, null, PageRequest.of(0, 20)));
    }

    @Test
    void assignedClassSearchKeepsEffectiveStreakAndFiltersToRequestedClass() {
        UUID userId = UUID.randomUUID(), teacherId = UUID.randomUUID(), classId = UUID.randomUUID();
        User actor = new User(); actor.setId(userId); actor.setRole(Role.TEACHER);
        Teacher teacher = new Teacher(); teacher.setId(teacherId);
        SchoolClass schoolClass = new SchoolClass(); schoolClass.setId(classId);
        TeacherClassAssignment assignment = new TeacherClassAssignment(); assignment.setSchoolClass(schoolClass);
        User learner = new User(); learner.setId(UUID.randomUUID()); learner.setRole(Role.STUDENT);
        Student student = new Student(); student.setId(UUID.randomUUID()); student.setUser(learner);
        student.setClassEntity(schoolClass); student.setCurrentStreak(5); student.setLongestStreak(8);
        student.setLastActivityDate(java.time.Instant.now().minusSeconds(4 * 86400));
        when(userRepository.findById(userId)).thenReturn(Optional.of(actor));
        when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
        when(assignmentRepository.findByTeacherIdWithClass(teacherId)).thenReturn(List.of(assignment));
        when(studentRepository.searchTeacherStudents(org.mockito.ArgumentMatchers.eq(java.util.Set.of(classId)),
                org.mockito.ArgumentMatchers.isNull(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(student)));

        var response = service.searchStudents(userId, classId, null, PageRequest.of(0, 20));

        org.junit.jupiter.api.Assertions.assertEquals(0, response.getContent().get(0).getCurrentStreak());
        org.junit.jupiter.api.Assertions.assertEquals(5, student.getCurrentStreak());
        org.mockito.Mockito.verify(studentRepository).searchTeacherStudents(
                org.mockito.ArgumentMatchers.eq(java.util.Set.of(classId)), org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any());
    }
}
