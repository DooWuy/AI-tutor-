package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.DocumentMetadataRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.DocumentSummaryResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.DocumentLifecycleService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class DocumentController {

    private final DocumentLifecycleService documentLifecycleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentSummaryResponse>>> list(
            @RequestParam(required = false) UUID lessonId,
            @RequestParam(required = false) UUID bookId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.<List<DocumentSummaryResponse>>builder()
                .success(true)
                .message("Lấy danh sách tài liệu thành công")
                .data(documentLifecycleService.list(lessonId, bookId, principal))
                .build());
    }

    @PutMapping("/{id}/metadata")
    public ResponseEntity<ApiResponse<DocumentSummaryResponse>> updateMetadata(
            @PathVariable UUID id,
            @RequestBody DocumentMetadataRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.<DocumentSummaryResponse>builder()
                .success(true)
                .message("Cập nhật phân loại tài liệu thành công")
                .data(documentLifecycleService.updateMetadata(id, request, principal))
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        documentLifecycleService.delete(id, principal);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã xóa tài liệu và toàn bộ vector liên quan")
                .build());
    }
}
