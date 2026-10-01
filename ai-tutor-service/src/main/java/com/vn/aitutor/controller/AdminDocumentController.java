package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IDocumentIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/documents")
@RequiredArgsConstructor
@Slf4j
public class AdminDocumentController {

    private final IDocumentIngestionService documentIngestionService;

    /**
     * API nạp dữ liệu từ file PDF vào Vector Database (Chỉ dành cho Admin hoặc Giáo viên)
     */
    @PostMapping(value = "/ingest/pdf", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')") // Giới hạn quyền Admin hoặc Giáo viên
    public ResponseEntity<ApiResponse<Void>> ingestPdf(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam("file") MultipartFile file,
            @RequestParam("subject") String subject,
            @RequestParam("gradeLevel") String gradeLevel) {
        log.info("Nhận được request nạp file PDF: {}", file.getOriginalFilename());
        try {
            documentIngestionService.ingestPdfDocument(
                    file, 
                    subject, 
                    gradeLevel, 
                    userPrincipal.getUsers().getId()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<Void>builder()
                    .success(true)
                    .message("Tài liệu đã được tải lên thành công. Quá trình bóc tách OCR và Vector hóa đang chạy ngầm.")
                    .build());
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.<Void>builder()
                    .success(false)
                    .message("Lỗi khi nạp file PDF: " + e.getMessage())
                    .build());
        }
    }
}
