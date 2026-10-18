package com.vn.aitutor.service.classroom;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.dto.request.classroom.ClassAssignmentRequest;
import com.vn.aitutor.dto.response.analytics.ClassAssignmentResponse;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.TeacherClassAssignment;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class SchoolClassServiceImplTest {

    @Mock private SchoolClassRepository schoolClassRepository;
    @Mock private TeacherClassAssignmentRepository assignmentRepository;
    @Mock private TeacherRepository teacherRepository;
    @Mock private AcademicCalendar academicCalendar;

    private SchoolClassServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SchoolClassServiceImpl(
                schoolClassRepository,
                assignmentRepository,
                teacherRepository,
                academicCalendar
        );
    }

    @Test
    void findOrCreate_existingClass_returnsExisting() {
        String schoolName = "THPT Chuyen";
        String grade = "10";
        String className = "10A1";
        String year = "2024-2025";

        when(academicCalendar.currentAcademicYear(any(Instant.class))).thenReturn(year);
        SchoolClass existing = new SchoolClass();
        existing.setId(UUID.randomUUID());
        existing.setName(className);
        existing.setSchoolName(schoolName);

        when(schoolClassRepository.findBySchoolYearAndName(schoolName, year, className))
                .thenReturn(Optional.of(existing));

        SchoolClass result = service.findOrCreate(schoolName, grade, className);

        assertSame(existing, result);
        verify(schoolClassRepository, never()).save(any());
    }

    @Test
    void findOrCreate_newClass_createsAndSaves() {
        String schoolName = "THPT Chuyen";
        String grade = "10";
        String className = "10A2";
        String year = "2024-2025";

        when(academicCalendar.currentAcademicYear(any(Instant.class))).thenReturn(year);
        when(schoolClassRepository.findBySchoolYearAndName(schoolName, year, className))
                .thenReturn(Optional.empty());

        when(schoolClassRepository.save(any(SchoolClass.class))).thenAnswer(invocation -> {
            SchoolClass c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        SchoolClass result = service.findOrCreate(schoolName, grade, className);

        assertNotNull(result);
        assertEquals("10A2", result.getName());
        assertEquals("10", result.getGradeLevel());
        assertEquals(year, result.getAcademicYear());
        verify(schoolClassRepository).save(any(SchoolClass.class));
    }

    @Test
    void findOrCreate_blankClassName_throwsBadRequest() {
        assertThrows(ResourceBadRequestException.class, () ->
                service.findOrCreate("School", "10", "   "));
    }

    @Test
    void assignTeacher_classNotFound_throwsNotFound() {
        UUID classId = UUID.randomUUID();
        ClassAssignmentRequest request = new ClassAssignmentRequest();
        when(schoolClassRepository.findById(classId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                service.assignTeacher(classId, request));
    }

    @Test
    void assignTeacher_teacherNotFound_throwsNotFound() {
        UUID classId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();
        ClassAssignmentRequest request = new ClassAssignmentRequest();
        request.setTeacherId(teacherId);

        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(new SchoolClass()));
        when(teacherRepository.findById(teacherId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                service.assignTeacher(classId, request));
    }

    @Test
    void assignTeacher_homeroomAssignment_clearsOldAndSetsNew() {
        UUID classId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();

        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(classId);

        Teacher teacher = new Teacher();
        teacher.setId(teacherId);

        ClassAssignmentRequest request = new ClassAssignmentRequest();
        request.setTeacherId(teacherId);
        request.setHomeroom(true);
        request.setSubject("ALL");

        when(schoolClassRepository.findById(classId)).thenReturn(Optional.of(schoolClass));
        when(teacherRepository.findById(teacherId)).thenReturn(Optional.of(teacher));
        when(assignmentRepository.findByTeacherClassAndSubject(teacherId, classId, null))
                .thenReturn(Optional.empty());

        when(assignmentRepository.save(any(TeacherClassAssignment.class))).thenAnswer(invocation -> {
            TeacherClassAssignment a = invocation.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        ClassAssignmentResponse response = service.assignTeacher(classId, request);

        assertNotNull(response);
        assertEquals(classId, response.getClassId());
        assertEquals(teacherId, response.getTeacherId());
        assertTrue(response.isHomeroom());
        verify(assignmentRepository).clearHomeroomForClass(classId);
        verify(schoolClassRepository).save(schoolClass);
    }
}
