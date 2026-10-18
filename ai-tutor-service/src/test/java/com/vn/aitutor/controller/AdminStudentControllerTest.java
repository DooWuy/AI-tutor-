package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.user.StudentAdminCreateRequest;
import com.vn.aitutor.dto.request.user.StudentAdminUpdateRequest;
import com.vn.aitutor.dto.response.*;
import com.vn.aitutor.dto.response.user.*;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.service.user.IAdminStudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class AdminStudentControllerTest {

    @Mock
    private IAdminStudentService adminStudentService;

    private AdminStudentController controller;

    @BeforeEach
    void setUp() {
        controller = new AdminStudentController(adminStudentService);
    }

    @Test
    void searchStudents_success() {
        PageResponseDTO<StudentAdminListItemResponse> pageResponse = PageResponseDTO.<StudentAdminListItemResponse>builder()
                .content(Collections.emptyList())
                .page(1)
                .size(20)
                .build();

        when(adminStudentService.searchStudents(isNull(), isNull(), isNull(), isNull(), isNull(), any(org.springframework.data.domain.PageRequest.class)))
                .thenReturn(pageResponse);

        ResponseEntity<PageResponseDTO<StudentAdminListItemResponse>> response =
                controller.searchStudents(null, null, null, null, null, 1, 20, "createdAt", "desc");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void searchStudents_invalidPagination_throwsBadRequest() {
        assertThrows(ResourceBadRequestException.class, () ->
                controller.searchStudents(null, null, null, null, null, 0, 20, "createdAt", "desc"));

        assertThrows(ResourceBadRequestException.class, () ->
                controller.searchStudents(null, null, null, null, null, 1, 51, "createdAt", "desc"));
    }

    @Test
    void getStudent_returnsStudentDetail() {
        UUID studentId = UUID.randomUUID();
        StudentAdminDetailResponse detail = StudentAdminDetailResponse.builder()
                .studentId(studentId)
                .fullName("Nguyen Van C")
                .build();

        when(adminStudentService.getStudentDetail(studentId)).thenReturn(ApiResponse.<StudentAdminDetailResponse>builder()
                .success(true)
                .data(detail)
                .build());

        ResponseEntity<ApiResponse<StudentAdminDetailResponse>> response = controller.getStudent(studentId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Nguyen Van C", response.getBody().getData().getFullName());
    }

    @Test
    void createStudent_returnsCreated() {
        StudentAdminCreateRequest request = new StudentAdminCreateRequest();
        when(adminStudentService.createStudent(request)).thenReturn(ApiResponse.<StudentAdminDetailResponse>builder()
                .success(true)
                .build());

        ResponseEntity<ApiResponse<StudentAdminDetailResponse>> response = controller.createStudent(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void updateStudent_returnsSuccess() {
        UUID studentId = UUID.randomUUID();
        StudentAdminUpdateRequest request = new StudentAdminUpdateRequest();
        when(adminStudentService.updateStudent(studentId, request)).thenReturn(ApiResponse.<StudentAdminDetailResponse>builder()
                .success(true)
                .build());

        ResponseEntity<ApiResponse<StudentAdminDetailResponse>> response = controller.updateStudent(studentId, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void toggleStatus_returnsSuccess() {
        UUID studentId = UUID.randomUUID();
        when(adminStudentService.toggleStudentStatus(studentId)).thenReturn(ApiResponse.<StudentStatusUpdateResponse>builder()
                .success(true)
                .build());

        ResponseEntity<ApiResponse<StudentStatusUpdateResponse>> response = controller.toggleStatus(studentId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void softDelete_returnsSuccess() {
        UUID studentId = UUID.randomUUID();
        when(adminStudentService.softDeleteStudent(studentId)).thenReturn(ApiResponse.<String>builder()
                .success(true)
                .message("Đã xóa học sinh")
                .build());

        ResponseEntity<ApiResponse<String>> response = controller.softDelete(studentId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void downloadTemplate_returnsExcelBytes() {
        ResponseEntity<byte[]> response = controller.downloadTemplate();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().length > 0);
        assertTrue(response.getHeaders().getFirst("Content-Disposition").contains("mau-nhap-hoc-sinh.xlsx"));
    }

    @Test
    void importExcel_withValidFile_returnsSuccess() {
        MockMultipartFile file = new MockMultipartFile("file", "students.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "sample content".getBytes());

        StudentImportResponse importResult = StudentImportResponse.builder()
                .totalRows(1)
                .successCount(1)
                .errorCount(0)
                .build();

        when(adminStudentService.importStudentsFromExcel(any(byte[].class))).thenReturn(ApiResponse.<StudentImportResponse>builder()
                .success(true)
                .data(importResult)
                .build());

        ResponseEntity<ApiResponse<StudentImportResponse>> response = controller.importExcel(file);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().getSuccessCount());
    }

    @Test
    void importExcel_emptyFile_throwsBadRequest() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.xlsx", "text/plain", new byte[0]);

        assertThrows(ResourceBadRequestException.class, () -> controller.importExcel(emptyFile));
    }
}
