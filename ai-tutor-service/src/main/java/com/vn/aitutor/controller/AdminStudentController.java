package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.StudentAdminCreateRequest;
import com.vn.aitutor.dto.request.StudentAdminUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.StudentAdminListItemResponse;
import com.vn.aitutor.dto.response.StudentStatusUpdateResponse;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.service.IAdminStudentService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/students")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminStudentController {
    private final IAdminStudentService adminStudentService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<StudentAdminListItemResponse>> searchStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String gradeLevel,
            @RequestParam(required = false) String schoolName,
            @RequestParam(required = false) UUID classId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        if (page < 1 || size < 1 || size > 50) {
            throw new ResourceBadRequestException("page phải >= 1 và size phải trong khoảng 1-50");
        }
        Sort.Direction sortDirection;
        try {
            sortDirection = Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("direction phải là asc hoặc desc");
        }
        return ResponseEntity.ok(adminStudentService.searchStudents(search, active, gradeLevel, schoolName, classId,
                PageRequest.of(page - 1, size, Sort.by(sortDirection, sort))));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<ApiResponse<StudentAdminDetailResponse>> getStudent(@PathVariable UUID studentId) {
        return ResponseEntity.ok(adminStudentService.getStudentDetail(studentId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudentAdminDetailResponse>> createStudent(
            @Valid @RequestBody StudentAdminCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminStudentService.createStudent(request));
    }

    @PutMapping("/{studentId}")
    public ResponseEntity<ApiResponse<StudentAdminDetailResponse>> updateStudent(
            @PathVariable UUID studentId, @Valid @RequestBody StudentAdminUpdateRequest request) {
        return ResponseEntity.ok(adminStudentService.updateStudent(studentId, request));
    }

    @PatchMapping("/{studentId}/status")
    public ResponseEntity<ApiResponse<StudentStatusUpdateResponse>> toggleStatus(@PathVariable UUID studentId) {
        return ResponseEntity.ok(adminStudentService.toggleStudentStatus(studentId));
    }

    @DeleteMapping("/{studentId}")
    public ResponseEntity<ApiResponse<String>> softDelete(@PathVariable UUID studentId) {
        return ResponseEntity.ok(adminStudentService.softDeleteStudent(studentId));
    }
}
