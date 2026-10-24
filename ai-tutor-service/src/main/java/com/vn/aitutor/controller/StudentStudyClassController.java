package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.classroom.StudyClassJoinRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.classroom.StudyClassJoinResponse;
import com.vn.aitutor.dto.response.classroom.StudentStudyClassResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.classroom.StudyClassService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/study-classes")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_STUDENT')")
public class StudentStudyClassController {

    private final StudyClassService studyClassService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudentStudyClassResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.<List<StudentStudyClassResponse>>builder()
                .success(true)
                .message("Lấy danh sách lớp học thêm thành công")
                .data(studyClassService.listForStudent(principal))
                .build());
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<StudentStudyClassResponse>> get(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID classId) {
        return ResponseEntity.ok(ApiResponse.<StudentStudyClassResponse>builder()
                .success(true)
                .message("Lấy thông tin lớp học thêm thành công")
                .data(studyClassService.getForStudent(principal, classId))
                .build());
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<StudyClassJoinResponse>> join(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StudyClassJoinRequest request) {
        return ResponseEntity.ok(ApiResponse.<StudyClassJoinResponse>builder()
                .success(true)
                .message("Đã gửi yêu cầu vào lớp")
                .data(studyClassService.join(principal, request))
                .build());
    }
}
