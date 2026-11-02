package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.curriculum.DocumentMetadataRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.curriculum.DocumentSummaryResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.curriculum.DocumentLifecycleService;
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

    @GetMapping("/page")
    @io.swagger.v3.oas.annotations.Operation(summary="Paginated documents; Admin sees all owners, Teacher sees own")
    public ResponseEntity<com.vn.aitutor.dto.response.PageResponseDTO<DocumentSummaryResponse>> browse(
        @RequestParam(required=false) String search, @RequestParam(required=false) String subject,
        @RequestParam(required=false) String gradeLevel, @RequestParam(required=false) com.vn.aitutor.entity.enums.DocumentStatus status,
        @RequestParam(required=false) UUID creatorId, @RequestParam(defaultValue="1") int page,
        @RequestParam(defaultValue="20") int size, @AuthenticationPrincipal UserPrincipal principal) {
        if(page<1 || size<1 || size>50) throw new com.vn.aitutor.exception.ResourceBadRequestException("Phân trang không hợp lệ");
        return ResponseEntity.ok(documentLifecycleService.browse(search,subject,gradeLevel,status,creatorId,page,size,principal));
    }

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
