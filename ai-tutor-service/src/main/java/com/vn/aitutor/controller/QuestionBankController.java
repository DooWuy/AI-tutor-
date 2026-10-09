package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.BulkDeleteQuestionsRequest;
import com.vn.aitutor.dto.request.GenerateQuestionsRequest;
import com.vn.aitutor.dto.request.QuestionUpsertRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.QuestionBatchResponse;
import com.vn.aitutor.dto.response.QuestionResponse;
import com.vn.aitutor.dto.response.SkillResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.GenerationJobService;
import com.vn.aitutor.service.QuestionBankService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/v1/question-bank")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class QuestionBankController {

    private final QuestionBankService questionBankService;
    private final GenerationJobService generationJobService;

    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<SkillResponse>>> listSkills(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String gradeLevel) {
        return ResponseEntity.ok(ok("Lấy danh sách kỹ năng thành công", questionBankService.listSkills(subject, gradeLevel)));
    }

    @GetMapping("/skills/{lessonId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> listQuestions(@PathVariable UUID lessonId) {
        return ResponseEntity.ok(ok("Lấy danh sách câu hỏi thành công", questionBankService.listQuestions(lessonId)));
    }

    @PostMapping("/skills/{lessonId}/questions")
    public ResponseEntity<ApiResponse<QuestionResponse>> create(
            @PathVariable UUID lessonId,
            @Valid @RequestBody QuestionUpsertRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ok("Đã lưu câu hỏi vào ngân hàng", questionBankService.create(lessonId, request, principal)));
    }

    @GetMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponse<QuestionResponse>> get(@PathVariable UUID questionId) {
        return ResponseEntity.ok(ok("Lấy câu hỏi thành công", questionBankService.getQuestion(questionId)));
    }

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponse<QuestionResponse>> update(
            @PathVariable UUID questionId, @Valid @RequestBody QuestionUpsertRequest request) {
        return ResponseEntity.ok(ok("Đã cập nhật câu hỏi", questionBankService.update(questionId, request)));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID questionId) {
        questionBankService.delete(questionId);
        return ResponseEntity.ok(ok("Đã xóa câu hỏi", null));
    }

    @PostMapping("/questions/bulk-delete")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> bulkDelete(
            @Valid @RequestBody BulkDeleteQuestionsRequest request) {
        int deleted = questionBankService.bulkDelete(request.getIds());
        return ResponseEntity.ok(ok("Đã xóa các câu hỏi đã chọn", Map.of("deleted", deleted)));
    }

    @PostMapping("/skills/{lessonId}/generate")
    public ResponseEntity<ApiResponse<QuestionBatchResponse>> generate(
            @PathVariable UUID lessonId,
            @Valid @RequestBody GenerateQuestionsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ok(
                "AI đã soạn câu hỏi. Hãy xem trước trước khi nạp vào ngân hàng",
                questionBankService.generate(lessonId, request, principal)));
    }

    @PutMapping("/batches/{batchId}/questions/{questionId}")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateDraft(
            @PathVariable UUID batchId,
            @PathVariable UUID questionId,
            @Valid @RequestBody QuestionUpsertRequest request) {
        return ResponseEntity.ok(ok("Đã cập nhật câu hỏi nháp", questionBankService.updateInBatch(batchId, questionId, request)));
    }

    @DeleteMapping("/batches/{batchId}/questions/{questionId}")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(
            @PathVariable UUID batchId, @PathVariable UUID questionId) {
        questionBankService.deleteInBatch(batchId, questionId);
        return ResponseEntity.ok(ok("Đã bỏ câu hỏi khỏi lô", null));
    }

    @PostMapping("/batches/{batchId}/confirm")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> confirm(@PathVariable UUID batchId) {
        List<QuestionResponse> saved = questionBankService.confirm(batchId);
        generationJobService.acknowledgeBatch(batchId);
        return ResponseEntity.ok(ok("Đã nạp câu hỏi vào ngân hàng", saved));
    }

    @DeleteMapping("/batches/{batchId}")
    public ResponseEntity<ApiResponse<Void>> discard(@PathVariable UUID batchId) {
        questionBankService.discard(batchId);
        generationJobService.acknowledgeBatch(batchId);
        return ResponseEntity.ok(ok("Đã hủy lô câu hỏi", null));
    }

    private <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
