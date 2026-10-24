package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.classroom.StudyClassJoinRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.StudentStudyClassCard;
import com.vn.aitutor.dto.response.classroom.StudyClassJoinResponse;
import com.vn.aitutor.dto.response.classroom.StudentStudyClassResponse;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.classroom.StudyClassClassroomService;
import com.vn.aitutor.service.classroom.StudyClassService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

@ExtendWith(MockitoExtension.class)
class StudentStudyClassControllerTest {

    @Mock
    private StudyClassService studyClassService;

    @Mock
    private StudyClassClassroomService studyClassClassroomService;

    private StudentStudyClassController controller;
    private UserPrincipal studentPrincipal;

    @BeforeEach
    void setUp() {
        controller = new StudentStudyClassController(studyClassService, studyClassClassroomService);
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.STUDENT);
        user.setFullName("Lê Học Sinh");
        user.setEmail("student@aitutor.vn");
        studentPrincipal = UserPrincipal.builder().users(user).build();
    }

    @Test
    void join_submitsJoinRequestSuccessfully() {
        StudyClassJoinRequest request = new StudyClassJoinRequest();
        request.setClassCode("ABC123");

        StudyClassJoinResponse joinResponse = StudyClassJoinResponse.builder()
                .enrollmentId(UUID.randomUUID())
                .classId(UUID.randomUUID())
                .className("Lớp Văn 12")
                .classCode("ABC123")
                .status(EnrollmentStatus.PENDING)
                .requestedAt(Instant.parse("2026-10-24T08:00:00Z"))
                .build();

        when(studyClassService.join(studentPrincipal, request)).thenReturn(joinResponse);

        ResponseEntity<ApiResponse<StudyClassJoinResponse>> response =
                controller.join(studentPrincipal, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Đã gửi yêu cầu vào lớp", response.getBody().getMessage());
        assertEquals("Lớp Văn 12", response.getBody().getData().getClassName());
        assertEquals("ABC123", response.getBody().getData().getClassCode());
        assertEquals(EnrollmentStatus.PENDING, response.getBody().getData().getStatus());
        assertNotNull(response.getBody().getData().getEnrollmentId());
        assertNotNull(response.getBody().getData().getClassId());
        assertNotNull(response.getBody().getData().getRequestedAt());
        verify(studyClassService).join(studentPrincipal, request);
    }

    @Test
    void list_returnsOnlyCurrentStudentsEnrollments() {
        var item = StudentStudyClassCard.builder()
                .enrollmentId(UUID.randomUUID())
                .classId(UUID.randomUUID())
                .name("Lớp Toán 5A")
                .enrollmentStatus(EnrollmentStatus.APPROVED)
                .build();
        when(studyClassClassroomService.myClasses(studentPrincipal)).thenReturn(List.of(item));

        var response = controller.mine(studentPrincipal);

        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        assertEquals(item.getEnrollmentId(), response.getBody().getData().get(0).getEnrollmentId());
        verify(studyClassClassroomService).myClasses(studentPrincipal);
    }

    @Test
    void list_returnsAnEmptyArrayWhenStudentHasNoEnrollments() {
        when(studyClassClassroomService.myClasses(studentPrincipal)).thenReturn(List.of());

        var response = controller.mine(studentPrincipal);

        assertTrue(response.getBody().isSuccess());
        assertTrue(response.getBody().getData().isEmpty());
        verify(studyClassClassroomService).myClasses(studentPrincipal);
    }

    @Test
    void get_returnsOwnedEnrollmentDetail() {
        UUID classId = UUID.randomUUID();
        var item = StudentStudyClassResponse.builder()
                .enrollmentId(UUID.randomUUID())
                .classId(classId)
                .className("Lớp Toán 5A")
                .enrollmentStatus(EnrollmentStatus.PENDING)
                .build();
        when(studyClassService.getForStudent(studentPrincipal, classId)).thenReturn(item);

        var response = controller.get(studentPrincipal, classId);

        assertTrue(response.getBody().isSuccess());
        assertEquals(classId, response.getBody().getData().getClassId());
        verify(studyClassService).getForStudent(studentPrincipal, classId);
    }

    @Test
    void controllerIsRestrictedToStudents() {
        assertEquals("hasAuthority('ROLE_STUDENT')",
                StudentStudyClassController.class.getAnnotation(PreAuthorize.class).value());
    }
}
