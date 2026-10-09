package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.QuizAttemptHistoryResponse;
import com.vn.aitutor.service.IStudentQuizAttemptService;
import com.vn.aitutor.service.QuizSubmissionService;
import com.vn.aitutor.dto.request.*;
import com.vn.aitutor.dto.response.QuizDraftResponse;
import com.vn.aitutor.dto.response.QuizAttemptDetailResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/quiz-attempts")
@RequiredArgsConstructor
public class StudentQuizAttemptController {

    private final IStudentQuizAttemptService studentQuizAttemptService;
    private final QuizSubmissionService submissions;

    @PostMapping("/draft")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<QuizDraftResponse> draft(@Valid @RequestBody QuizDraftRequest request) {
        return ApiResponse.<QuizDraftResponse>builder().success(true).data(submissions.saveDraft(request)).build();
    }

    @GetMapping("/draft/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<QuizDraftResponse> draft(@PathVariable UUID id) {
        return ApiResponse.<QuizDraftResponse>builder().success(true).data(submissions.getDraft(id)).build();
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<QuizAttemptDetailResponse> submit(@Valid @RequestBody QuizSubmitRequest request) {
        return ApiResponse.<QuizAttemptDetailResponse>builder().success(true).data(submissions.submit(request)).build();
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<QuizAttemptHistoryResponse>>> getMyHistory() {
        List<QuizAttemptHistoryResponse> data = studentQuizAttemptService.getMyHistory();
        return ResponseEntity.ok(ApiResponse.<List<QuizAttemptHistoryResponse>>builder()
                .success(true)
                .message("Fetched quiz history successfully")
                .data(data)
                .build());
    }

    @PatchMapping("/{id}/hide")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> hideAttempt(@PathVariable UUID id) {
        studentQuizAttemptService.hideAttempt(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Quiz attempt hidden successfully")
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<com.vn.aitutor.dto.response.QuizAttemptDetailResponse>> getAttemptDetail(@PathVariable UUID id) {
        com.vn.aitutor.dto.response.QuizAttemptDetailResponse data = studentQuizAttemptService.getAttemptDetail(id);
        return ResponseEntity.ok(ApiResponse.<com.vn.aitutor.dto.response.QuizAttemptDetailResponse>builder()
                .success(true)
                .message("Fetched quiz attempt detail successfully")
                .data(data)
                .build());
    }
}
