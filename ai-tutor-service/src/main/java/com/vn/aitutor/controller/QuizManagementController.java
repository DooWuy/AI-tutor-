package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.AssignQuestionsRequest;
import com.vn.aitutor.dto.request.QuizGenerateRequest;
import com.vn.aitutor.dto.request.QuizUpsertRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.QuizResponse;
import com.vn.aitutor.dto.response.QuizStatisticsResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.QuizManagementService;
import com.vn.aitutor.service.QuizStatisticsService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class QuizManagementController {

    private static final MediaType XLSX = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final QuizManagementService quizManagementService;
    private final QuizStatisticsService quizStatisticsService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuizResponse>>> list(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String gradeLevel,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "Lấy danh sách đề thi thành công",
                quizManagementService.list(subject, gradeLevel, status, principal)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuizResponse>> create(
            @Valid @RequestBody QuizUpsertRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ok("Đã tạo đề thi", quizManagementService.create(request, principal)));
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<ApiResponse<QuizResponse>> get(
            @PathVariable UUID quizId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Lấy đề thi thành công", quizManagementService.get(quizId, principal)));
    }

    @PutMapping("/{quizId}")
    public ResponseEntity<ApiResponse<QuizResponse>> update(
            @PathVariable UUID quizId,
            @Valid @RequestBody QuizUpsertRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Đã cập nhật đề thi", quizManagementService.update(quizId, request, principal)));
    }

    @PostMapping("/{quizId}/publish")
    public ResponseEntity<ApiResponse<QuizResponse>> publish(
            @PathVariable UUID quizId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Đã phát hành đề thi", quizManagementService.publish(quizId, principal)));
    }

    @PostMapping("/{quizId}/archive")
    public ResponseEntity<ApiResponse<QuizResponse>> archive(
            @PathVariable UUID quizId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Đã chuyển đề thi sang ngừng hoạt động", quizManagementService.archive(quizId, principal)));
    }

    @PostMapping("/{quizId}/draft")
    public ResponseEntity<ApiResponse<QuizResponse>> draft(
            @PathVariable UUID quizId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Đã chuyển đề thi về bản nháp", quizManagementService.draft(quizId, principal)));
    }

    @DeleteMapping("/{quizId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID quizId, @AuthenticationPrincipal UserPrincipal principal) {
        quizManagementService.delete(quizId, principal);
        return ResponseEntity.ok(ok("Đã xóa đề thi", null));
    }

    @PostMapping("/{quizId}/questions")
    public ResponseEntity<ApiResponse<QuizResponse>> assign(
            @PathVariable UUID quizId,
            @Valid @RequestBody AssignQuestionsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "Đã gán câu hỏi vào đề",
                quizManagementService.assign(quizId, request.getQuestionIds(), principal)));
    }

    @DeleteMapping("/{quizId}/questions/{questionId}")
    public ResponseEntity<ApiResponse<QuizResponse>> removeQuestion(
            @PathVariable UUID quizId,
            @PathVariable UUID questionId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "Đã gỡ câu hỏi khỏi đề",
                quizManagementService.removeQuestion(quizId, questionId, principal)));
    }

    @PostMapping("/{quizId}/generate")
    public ResponseEntity<ApiResponse<QuizResponse>> generate(
            @PathVariable UUID quizId,
            @Valid @RequestBody QuizGenerateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "Đã soạn bộ câu hỏi cho đề thi",
                quizManagementService.generate(quizId, request, principal)));
    }

    @GetMapping("/{quizId}/statistics")
    public ResponseEntity<ApiResponse<QuizStatisticsResponse>> statistics(
            @PathVariable UUID quizId, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok("Lấy thống kê đề thi thành công", quizStatisticsService.statistics(quizId, principal)));
    }

    @GetMapping("/{quizId}/statistics/export.xlsx")
    public ResponseEntity<byte[]> export(
            @PathVariable UUID quizId, @AuthenticationPrincipal UserPrincipal principal) {
        byte[] body = quizStatisticsService.export(quizId, principal);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ket-qua-de-thi.xlsx\"")
                .contentType(XLSX)
                .body(body);
    }

    private <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
