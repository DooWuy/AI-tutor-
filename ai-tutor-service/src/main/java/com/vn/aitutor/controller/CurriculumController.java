package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.BookUpsertRequest;
import com.vn.aitutor.dto.request.ChapterUpsertRequest;
import com.vn.aitutor.dto.request.ExtractStructureRequest;
import com.vn.aitutor.dto.request.LessonUpsertRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.BookResponse;
import com.vn.aitutor.dto.response.ChapterResponse;
import com.vn.aitutor.dto.response.LessonResponse;
import com.vn.aitutor.dto.response.TocAnalysisResponse;
import com.vn.aitutor.entity.enums.DocumentType;
import com.vn.aitutor.entity.enums.TocExtractionMethod;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.BookExtractionService;
import com.vn.aitutor.service.CurriculumService;
import com.vn.aitutor.service.IDocumentIngestionService;
import com.vn.aitutor.service.TocAnalysisService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/curriculum")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
public class CurriculumController {

    private final CurriculumService curriculumService;
    private final TocAnalysisService tocAnalysisService;
    private final BookExtractionService bookExtractionService;
    private final IDocumentIngestionService documentIngestionService;

    @PostMapping("/books")
    public ResponseEntity<ApiResponse<BookResponse>> createBook(@Valid @RequestBody BookUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ok("Tạo sách thành công", curriculumService.createBook(request)));
    }

    @GetMapping("/books")
    public ResponseEntity<ApiResponse<List<BookResponse>>> listBooks(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String gradeLevel) {
        return ResponseEntity.ok(ok("Lấy danh sách sách thành công", curriculumService.listBooks(subject, gradeLevel)));
    }

    @GetMapping("/books/{bookId}")
    public ResponseEntity<ApiResponse<BookResponse>> getBook(@PathVariable UUID bookId) {
        return ResponseEntity.ok(ok("Lấy sách thành công", curriculumService.getBook(bookId)));
    }

    @PutMapping("/books/{bookId}")
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(
            @PathVariable UUID bookId, @Valid @RequestBody BookUpsertRequest request) {
        return ResponseEntity.ok(ok("Cập nhật sách thành công", curriculumService.updateBook(bookId, request)));
    }

    @DeleteMapping("/books/{bookId}")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable UUID bookId) {
        curriculumService.deleteBook(bookId);
        return ResponseEntity.ok(ok("Xóa sách thành công", null));
    }

    @PostMapping("/books/{bookId}/chapters")
    public ResponseEntity<ApiResponse<ChapterResponse>> createChapter(
            @PathVariable UUID bookId, @Valid @RequestBody ChapterUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ok("Tạo chương thành công", curriculumService.createChapter(bookId, request)));
    }

    @PutMapping("/chapters/{chapterId}")
    public ResponseEntity<ApiResponse<ChapterResponse>> updateChapter(
            @PathVariable UUID chapterId, @Valid @RequestBody ChapterUpsertRequest request) {
        return ResponseEntity.ok(ok("Cập nhật chương thành công", curriculumService.updateChapter(chapterId, request)));
    }

    @DeleteMapping("/chapters/{chapterId}")
    public ResponseEntity<ApiResponse<Void>> deleteChapter(@PathVariable UUID chapterId) {
        curriculumService.deleteChapter(chapterId);
        return ResponseEntity.ok(ok("Xóa chương thành công", null));
    }

    @PostMapping("/chapters/{chapterId}/lessons")
    public ResponseEntity<ApiResponse<LessonResponse>> createLesson(
            @PathVariable UUID chapterId, @Valid @RequestBody LessonUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ok("Tạo bài học thành công", curriculumService.createLesson(chapterId, request)));
    }

    @PutMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<LessonResponse>> updateLesson(
            @PathVariable UUID lessonId, @Valid @RequestBody LessonUpsertRequest request) {
        return ResponseEntity.ok(ok("Cập nhật bài học thành công", curriculumService.updateLesson(lessonId, request)));
    }

    @DeleteMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID lessonId) {
        curriculumService.deleteLesson(lessonId);
        return ResponseEntity.ok(ok("Xóa bài học thành công", null));
    }

    @PostMapping(value = "/lessons/{lessonId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UUID>> uploadLessonDocument(
            @PathVariable UUID lessonId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("documentType") String documentType,
            @AuthenticationPrincipal UserPrincipal principal) throws Exception {
        UUID documentId = documentIngestionService.uploadLessonDocument(
                lessonId,
                file,
                title,
                DocumentType.parseRequired(documentType),
                principal.getUsers().getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ok("Tải tài liệu thành công. Quá trình nạp tri thức đang chạy ngầm.", documentId));
    }

    @PostMapping(value = "/books/{bookId}/analyze-toc", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TocAnalysisResponse>> analyzeToc(
            @PathVariable UUID bookId,
            @RequestPart("file") MultipartFile file,
            @RequestPart("tocImages") List<MultipartFile> tocImages,
            @RequestParam("method") String method,
            @RequestParam(value = "curriculumName", required = false) String curriculumName) {
        TocAnalysisResponse result = tocAnalysisService.analyze(
                bookId, file, tocImages, TocExtractionMethod.parseRequired(method), curriculumName);
        return ResponseEntity.ok(ok("Phân tích mục lục thành công", result));
    }

    @PostMapping(value = "/books/{bookId}/extract-and-ingest", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> extractAndIngest(
            @PathVariable UUID bookId,
            @RequestPart("file") MultipartFile file,
            @RequestPart("structure") ExtractStructureRequest structure,
            @AuthenticationPrincipal UserPrincipal principal) {
        bookExtractionService.publish(bookId, file, structure, principal.getUsers().getId());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ok("Đã nhận yêu cầu cắt sách. Tiến trình chạy ngầm.", null));
    }

    private <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
