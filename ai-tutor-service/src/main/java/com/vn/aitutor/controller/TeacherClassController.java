package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.StudentAdminListItemResponse;
import com.vn.aitutor.dto.response.TeacherClassQuizResponse;
import com.vn.aitutor.dto.response.TeacherClassResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.TeacherClassService;
import java.util.List;
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
@RequestMapping("/api/v1/teacher/classes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_TEACHER','ROLE_ADMIN')")
public class TeacherClassController {

    private final TeacherClassService teacherClassService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeacherClassResponse>>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Lấy danh sách lớp thành công", teacherClassService.list(principal)));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<TeacherClassResponse>> get(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID classId) {
        return ResponseEntity.ok(ok("Lấy thông tin lớp thành công", teacherClassService.get(principal, classId)));
    }

    @GetMapping("/{classId}/students")
    public ResponseEntity<ApiResponse<PageResponseDTO<StudentAdminListItemResponse>>> students(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID classId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fullName") String sort,
            @RequestParam(defaultValue = "asc") String direction) {
        Sort.Direction d = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageResponseDTO<StudentAdminListItemResponse> data = teacherClassService.students(
                principal,
                classId,
                search,
                PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(1, size), 50), Sort.by(d, sort)));
        return ResponseEntity.ok(ok("Lấy sĩ số thành công", data));
    }

    @GetMapping("/{classId}/quizzes")
    public ResponseEntity<ApiResponse<List<TeacherClassQuizResponse>>> quizzes(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID classId) {
        return ResponseEntity.ok(ok("Lấy đề đã phát hành thành công", teacherClassService.quizzes(principal, classId)));
    }

    private <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
