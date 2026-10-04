package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.StudentAdminListItemResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.ITeacherStudentService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teacher/students")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_TEACHER')")
public class TeacherStudentController {
    private final ITeacherStudentService teacherStudentService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<StudentAdminListItemResponse>> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort.Direction d = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return ResponseEntity.ok(teacherStudentService.searchStudents(principal.getUsers().getId(), search,
                PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(1, size), 50), Sort.by(d, sort))));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<ApiResponse<StudentAdminDetailResponse>> getDetail(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID studentId) {
        return ResponseEntity.ok(teacherStudentService.getStudentDetail(principal.getUsers().getId(), studentId));
    }
}
