package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.StudyClassJoinRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.StudyClassJoinResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.StudyClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
