package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.ClassAssignmentRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.analytics.ClassAssignmentResponse;
import com.vn.aitutor.service.ISchoolClassService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/classes")
@RequiredArgsConstructor
public class ClassAssignmentController {

    private final ISchoolClassService schoolClassService;

    @PostMapping("/{classId}/assignments")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<ClassAssignmentResponse>> assignTeacher(
            @PathVariable UUID classId, @Valid @RequestBody ClassAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ClassAssignmentResponse>builder()
                        .success(true)
                        .message("Phân công giáo viên thành công")
                        .data(schoolClassService.assignTeacher(classId, request))
                        .build());
    }
}
