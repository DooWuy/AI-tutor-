package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.classroom.EnrollmentActionRequest;
import com.vn.aitutor.dto.request.classroom.StudyClassCreateRequest;
import com.vn.aitutor.dto.request.classroom.StudyClassUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.classroom.StudyClassListResponse;
import com.vn.aitutor.dto.response.classroom.StudyClassResponse;
import com.vn.aitutor.dto.response.classroom.StudyMemberResponse;
import com.vn.aitutor.dto.response.classroom.TeacherClassQuizResponse;
import com.vn.aitutor.dto.response.user.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.user.StudentAdminListItemResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.classroom.StudyClassClassroomService;
import com.vn.aitutor.service.classroom.StudyClassService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teacher/study-classes")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_TEACHER')")
public class StudyClassController {

    private final StudyClassService studyClassService;
    private final StudyClassClassroomService studyClassClassroomService;

    @GetMapping
    public ResponseEntity<ApiResponse<StudyClassListResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ok("Lấy danh sách lớp học thêm thành công", studyClassService.list(principal, status, keyword)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudyClassResponse>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StudyClassCreateRequest request) {
        return ResponseEntity.ok(ok("Đã tạo lớp học thêm", studyClassService.create(principal, request)));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<StudyClassResponse>> get(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID classId) {
        return ResponseEntity.ok(ok("Lấy lớp học thêm thành công", studyClassService.get(principal, classId)));
    }

    @PutMapping("/{classId}")
    public ResponseEntity<ApiResponse<StudyClassResponse>> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID classId,
            @Valid @RequestBody StudyClassUpdateRequest request) {
        return ResponseEntity.ok(ok("Đã cập nhật lớp học thêm", studyClassService.update(principal, classId, request)));
    }

    @PostMapping("/{classId}/dissolve")
    public ResponseEntity<ApiResponse<StudyClassResponse>> dissolve(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID classId) {
        return ResponseEntity.ok(ok("Đã giải tán lớp", studyClassService.dissolve(principal, classId)));
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
        Sort.Direction order = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        return ResponseEntity.ok(ok(
                "Lấy sĩ số thành công",
                studyClassClassroomService.students(
                        principal,
                        classId,
                        search,
                        PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(1, size), 50), Sort.by(order, sort)))));
    }

    @GetMapping("/{classId}/students/{studentId}")
    public ResponseEntity<ApiResponse<StudentAdminDetailResponse>> student(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID classId,
            @PathVariable UUID studentId) {
        return ResponseEntity.ok(studyClassClassroomService.studentDetail(principal, classId, studentId));
    }

    @GetMapping("/{classId}/quizzes")
    public ResponseEntity<ApiResponse<List<TeacherClassQuizResponse>>> quizzes(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID classId) {
        return ResponseEntity.ok(ok("Lấy đề đã phát hành thành công", studyClassClassroomService.quizzes(principal, classId)));
    }

    @GetMapping("/{classId}/requests")
    public ResponseEntity<ApiResponse<List<StudyMemberResponse>>> requests(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID classId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ok("Lấy yêu cầu gia nhập thành công", studyClassService.requests(principal, classId, status)));
    }

    @PostMapping("/{classId}/requests/{requestId}/action")
    public ResponseEntity<ApiResponse<StudyMemberResponse>> act(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID classId,
            @PathVariable UUID requestId,
            @Valid @RequestBody EnrollmentActionRequest request) {
        return ResponseEntity.ok(ok("Đã xử lý yêu cầu gia nhập", studyClassService.act(principal, classId, requestId, request)));
    }

    private <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
