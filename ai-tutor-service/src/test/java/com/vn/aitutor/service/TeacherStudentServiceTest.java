package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.TeacherClassAssignment;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.service.impl.TeacherStudentServiceImpl;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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
}
