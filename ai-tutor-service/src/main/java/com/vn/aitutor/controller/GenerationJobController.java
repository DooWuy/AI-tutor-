package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.GenerateQuestionsRequest;
import com.vn.aitutor.dto.request.QuizGenerateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.GenerationJobResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.GenerationJobService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class GenerationJobController {

    private final GenerationJobService generationJobService;

    @PostMapping("/api/v1/question-bank/skills/{lessonId}/generation-jobs")
    public ResponseEntity<ApiResponse<GenerationJobResponse>> startBank(
            @PathVariable UUID lessonId,
            @Valid @RequestBody GenerateQuestionsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "AI đang soạn câu hỏi. Bạn có thể rời trang, tiến trình vẫn tiếp tục",
                generationJobService.startBank(lessonId, request, principal)));
    }

    @GetMapping("/api/v1/question-bank/skills/{lessonId}/generation-jobs/current")
    public ResponseEntity<ApiResponse<GenerationJobResponse>> currentBank(
            @PathVariable UUID lessonId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "Lấy tác vụ AI của kỹ năng thành công",
                generationJobService.currentBank(lessonId, principal)));
    }

    @PostMapping("/api/v1/quizzes/{quizId}/generation-jobs")
    public ResponseEntity<ApiResponse<GenerationJobResponse>> startQuiz(
            @PathVariable UUID quizId,
            @Valid @RequestBody QuizGenerateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "AI đang soạn bộ câu hỏi. Bạn có thể rời trang, tiến trình vẫn tiếp tục",
                generationJobService.startQuiz(quizId, request, principal)));
    }

    @GetMapping("/api/v1/quizzes/{quizId}/generation-jobs/current")
    public ResponseEntity<ApiResponse<GenerationJobResponse>> currentQuiz(
            @PathVariable UUID quizId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "Lấy tác vụ AI của đề thi thành công",
                generationJobService.currentQuiz(quizId, principal)));
    }

    @GetMapping("/api/v1/generation-jobs/{jobId}")
    public ResponseEntity<ApiResponse<GenerationJobResponse>> get(
            @PathVariable UUID jobId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Lấy tác vụ AI thành công", generationJobService.get(jobId, principal)));
    }

    @PostMapping("/api/v1/generation-jobs/{jobId}/acknowledge")
    public ResponseEntity<ApiResponse<GenerationJobResponse>> acknowledge(
            @PathVariable UUID jobId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Đã ghi nhận tác vụ AI", generationJobService.acknowledge(jobId, principal)));
    }

    private <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
