package com.vn.aitutor.service;

import com.vn.aitutor.config.RabbitMQConfig;
import com.vn.aitutor.curriculum.PdfSplitterUtil;
import com.vn.aitutor.dto.message.BookExtractionMessage;
import com.vn.aitutor.dto.message.DocumentIngestionMessage;
import com.vn.aitutor.dto.request.ExtractStructureRequest;
import com.vn.aitutor.dto.request.ExtractStructureRequest.ChapterNode;
import com.vn.aitutor.dto.request.ExtractStructureRequest.LessonNode;
import com.vn.aitutor.entity.Book;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.DocumentType;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.UserRepository;
import java.io.File;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookExtractionService {

    private final CurriculumService curriculumService;
    private final LearningMaterialValidator learningMaterialValidator;
    private final ICloudinaryService cloudinaryService;
    private final BookExtractionTx bookExtractionTx;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public void publish(UUID bookId, MultipartFile file, ExtractStructureRequest structure, UUID userId) {
        curriculumService.requireBook(bookId);
        learningMaterialValidator.validateTextbook(file);
        if (structure == null || structure.getChapters() == null || structure.getChapters().isEmpty()) {
            throw new ResourceBadRequestException("Thiếu cấu trúc bài học đã xác nhận");
        }
        int offset = structure.getPdfPageOffset() == null ? 0 : structure.getPdfPageOffset();
        if (offset < 0) {
            throw new ResourceBadRequestException("Độ lệch trang không hợp lệ");
        }
        try {
            byte[] pdf = file.getBytes();
            int pages = PdfSplitterUtil.pageCount(pdf);
            validateRanges(structure, offset, pages);
            String path = cloudinaryService.uploadDocumentBytes(
                    pdf, file.getOriginalFilename() == null ? "textbook.pdf" : file.getOriginalFilename());
            BookExtractionMessage message = BookExtractionMessage.builder()
                    .bookId(bookId)
                    .requestedBy(userId)
                    .sourcePath(path)
                    .pdfPageOffset(offset)
                    .documentType(structure.getDocumentType())
                    .chapters(structure.getChapters())
                    .build();
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.DOCUMENT_EXCHANGE,
                    RabbitMQConfig.CURRICULUM_EXTRACTION_ROUTING_KEY,
                    message);
        } catch (ResourceBadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResourceBadRequestException("Không đọc được file PDF");
        }
    }

    public void run(BookExtractionMessage message) {
        File source = null;
        boolean temporary = message.getSourcePath() != null && message.getSourcePath().startsWith("http");
        int succeeded = 0;
        int failed = 0;
        try {
            source = cloudinaryService.materialize(message.getSourcePath());
            User user = userRepository.findById(message.getRequestedBy())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
            Book book = curriculumService.requireBook(message.getBookId());
            DocumentType fallback = DocumentType.parseOrDefault(message.getDocumentType(), DocumentType.THEORY);
            if (message.getChapters() == null) {
                return;
            }
            for (ChapterNode chapter : message.getChapters()) {
                if (chapter.getLessons() == null) {
                    continue;
                }
                for (LessonNode lesson : chapter.getLessons()) {
                    try {
                        int start = lesson.getStartPage() + message.getPdfPageOffset();
                        int end = lesson.getEndPage() + message.getPdfPageOffset();
                        byte[] part = PdfSplitterUtil.split(source, start, end);
                        var saved = bookExtractionTx.persist(book, user, chapter, lesson, fallback, part);
                        rabbitTemplate.convertAndSend(
                                RabbitMQConfig.DOCUMENT_EXCHANGE,
                                RabbitMQConfig.DOCUMENT_INGESTION_ROUTING_KEY,
                                DocumentIngestionMessage.builder()
                                        .documentId(saved.getId())
                                        .fileUrl(saved.getFilePath())
                                        .build());
                        succeeded++;
                    } catch (RuntimeException ex) {
                        failed++;
                        log.warn("Không cắt được bài {}: {}", lesson.getLessonName(), ex.getMessage());
                        notify(user.getId().toString(), null, -1, lesson.getLessonName() + ": " + ex.getMessage());
                    }
                }
            }
            notifySummary(user.getId().toString(), message.getBookId(), succeeded, failed);
        } catch (Exception ex) {
            log.error("Cắt sách thất bại", ex);
            if (message.getRequestedBy() != null) {
                notifySummary(message.getRequestedBy().toString(), message.getBookId(), succeeded, failed + 1);
            }
        } finally {
            if (temporary && source != null) {
                try {
                    Files.deleteIfExists(source.toPath());
                } catch (Exception ex) {
                    log.warn("Không xóa được file tạm {}", source.getPath());
                }
            }
        }
    }

    private void validateRanges(ExtractStructureRequest structure, int offset, int pages) {
        for (ChapterNode chapter : structure.getChapters()) {
            if (chapter.getLessons() == null || chapter.getLessons().isEmpty()) {
                throw new ResourceBadRequestException("Chương không có bài học");
            }
            for (LessonNode lesson : chapter.getLessons()) {
                if (lesson.getStartPage() == null || lesson.getEndPage() == null
                        || lesson.getStartPage() < 1 || lesson.getEndPage() < lesson.getStartPage()) {
                    throw new ResourceBadRequestException("Khoảng trang không hợp lệ");
                }
                if (lesson.getEndPage() + offset > pages) {
                    throw new ResourceBadRequestException(
                            "Khoảng trang vượt quá số trang của sách (" + pages + ")");
                }
            }
        }
    }

    private void notify(String userId, String documentId, int progress, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", documentId);
        payload.put("progress", progress);
        payload.put("message", message);
        messagingTemplate.convertAndSendToUser(userId, "/queue/document-progress", payload);
    }

    private void notifySummary(String userId, UUID bookId, int succeeded, int failed) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("bookId", bookId.toString());
        payload.put("succeeded", succeeded);
        payload.put("failed", failed);
        messagingTemplate.convertAndSendToUser(userId, "/queue/curriculum-ingest", payload);
    }
}


