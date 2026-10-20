package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.classroom.EnrollmentActionRequest;
import com.vn.aitutor.dto.request.classroom.StudyClassCreateRequest;
import com.vn.aitutor.dto.request.classroom.StudyClassUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.classroom.StudyClassListResponse;
import com.vn.aitutor.dto.response.classroom.StudyClassResponse;
import com.vn.aitutor.dto.response.classroom.StudyMemberResponse;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.StudyClassStatus;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.classroom.StudyClassService;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class StudyClassControllerTest {

    @Mock
    private StudyClassService studyClassService;

    private StudyClassController controller;
    private UserPrincipal teacherPrincipal;
    private UUID classId;

    @BeforeEach
    void setUp() {
        controller = new StudyClassController(studyClassService);
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.TEACHER);
        user.setFullName("Nguyễn Văn Thầy");
        user.setEmail("teacher@aitutor.vn");
        teacherPrincipal = UserPrincipal.builder().users(user).build();
        classId = UUID.randomUUID();
    }

    @Test
    void list_returnsListOfStudyClasses() {
        StudyClassListResponse listResponse = StudyClassListResponse.builder()
                .activeCount(1)
                .classes(Collections.singletonList(
                        StudyClassResponse.builder()
                                .id(classId)
                                .name("Lớp Toán Nâng Cao")
                                .status(StudyClassStatus.ACTIVE)
                                .build()
                ))
                .build();

        when(studyClassService.list(teacherPrincipal, "ACTIVE", "toán")).thenReturn(listResponse);

        ResponseEntity<ApiResponse<StudyClassListResponse>> response =
                controller.list(teacherPrincipal, "ACTIVE", "toán");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Lấy danh sách lớp học thêm thành công", response.getBody().getMessage());
        assertEquals(1, response.getBody().getData().getActiveCount());
        assertEquals(1, response.getBody().getData().getClasses().size());
        verify(studyClassService).list(teacherPrincipal, "ACTIVE", "toán");
    }

    @Test
    void create_createsAndReturnsStudyClass() {
        StudyClassCreateRequest request = new StudyClassCreateRequest();
        request.setName("Lớp Hóa 12");
        request.setMaxStudents(30);

        StudyClassResponse createdResponse = StudyClassResponse.builder()
                .id(classId)
                .name("Lớp Hóa 12")
                .classCode("CH1234")
                .status(StudyClassStatus.ACTIVE)
                .maxStudents(30)
                .build();

        when(studyClassService.create(teacherPrincipal, request)).thenReturn(createdResponse);

        ResponseEntity<ApiResponse<StudyClassResponse>> response =
                controller.create(teacherPrincipal, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Đã tạo lớp học thêm", response.getBody().getMessage());
        assertEquals("CH1234", response.getBody().getData().getClassCode());
        verify(studyClassService).create(teacherPrincipal, request);
    }

    @Test
    void get_returnsStudyClassDetail() {
        StudyClassResponse classResponse = StudyClassResponse.builder()
                .id(classId)
                .name("Lớp Lý 11")
                .status(StudyClassStatus.ACTIVE)
                .build();

        when(studyClassService.get(teacherPrincipal, classId)).thenReturn(classResponse);

        ResponseEntity<ApiResponse<StudyClassResponse>> response = controller.get(teacherPrincipal, classId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Lấy lớp học thêm thành công", response.getBody().getMessage());
        assertEquals(classId, response.getBody().getData().getId());
        verify(studyClassService).get(teacherPrincipal, classId);
    }

    @Test
    void update_updatesAndReturnsStudyClass() {
        StudyClassUpdateRequest request = new StudyClassUpdateRequest();
        request.setName("Lớp Lý 11 Chuyên Sâu");
        request.setMaxStudents(35);

        StudyClassResponse updatedResponse = StudyClassResponse.builder()
                .id(classId)
                .name("Lớp Lý 11 Chuyên Sâu")
                .maxStudents(35)
                .build();

        when(studyClassService.update(teacherPrincipal, classId, request)).thenReturn(updatedResponse);

        ResponseEntity<ApiResponse<StudyClassResponse>> response =
                controller.update(teacherPrincipal, classId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Đã cập nhật lớp học thêm", response.getBody().getMessage());
        assertEquals("Lớp Lý 11 Chuyên Sâu", response.getBody().getData().getName());
        verify(studyClassService).update(teacherPrincipal, classId, request);
    }

    @Test
    void dissolve_dissolvesAndReturnsStudyClass() {
        StudyClassResponse dissolvedResponse = StudyClassResponse.builder()
                .id(classId)
                .status(StudyClassStatus.DISSOLVED)
                .build();

        when(studyClassService.dissolve(teacherPrincipal, classId)).thenReturn(dissolvedResponse);

        ResponseEntity<ApiResponse<StudyClassResponse>> response =
                controller.dissolve(teacherPrincipal, classId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Đã giải tán lớp", response.getBody().getMessage());
        assertEquals(StudyClassStatus.DISSOLVED, response.getBody().getData().getStatus());
        verify(studyClassService).dissolve(teacherPrincipal, classId);
    }

    @Test
    void requests_returnsListOfJoinRequests() {
        UUID memberId = UUID.randomUUID();
        List<StudyMemberResponse> memberList = Collections.singletonList(
                StudyMemberResponse.builder()
                        .id(memberId)
                        .fullName("Trần Học Sinh")
                        .status(EnrollmentStatus.PENDING)
                        .build()
        );

        when(studyClassService.requests(teacherPrincipal, classId, "PENDING")).thenReturn(memberList);

        ResponseEntity<ApiResponse<List<StudyMemberResponse>>> response =
                controller.requests(teacherPrincipal, classId, "PENDING");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Lấy yêu cầu gia nhập thành công", response.getBody().getMessage());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("Trần Học Sinh", response.getBody().getData().get(0).getFullName());
        verify(studyClassService).requests(teacherPrincipal, classId, "PENDING");
    }

    @Test
    void act_reviewsAndUpdatesJoinRequest() {
        UUID requestId = UUID.randomUUID();
        EnrollmentActionRequest request = new EnrollmentActionRequest();
        request.setAction("approve");

        StudyMemberResponse memberResponse = StudyMemberResponse.builder()
                .id(requestId)
                .status(EnrollmentStatus.APPROVED)
                .build();

        when(studyClassService.act(teacherPrincipal, classId, requestId, request)).thenReturn(memberResponse);

        ResponseEntity<ApiResponse<StudyMemberResponse>> response =
                controller.act(teacherPrincipal, classId, requestId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Đã xử lý yêu cầu gia nhập", response.getBody().getMessage());
        assertEquals(EnrollmentStatus.APPROVED, response.getBody().getData().getStatus());
        verify(studyClassService).act(teacherPrincipal, classId, requestId, request);
    }
}
