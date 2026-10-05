package com.vn.aitutor.service.impl;

import com.vn.aitutor.curriculum.CurriculumCodes;
import com.vn.aitutor.entity.Book;
import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.DocumentStatus;
import com.vn.aitutor.entity.enums.DocumentType;
import com.vn.aitutor.repository.DocumentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.CurriculumService;
import com.vn.aitutor.service.ICloudinaryService;
import com.vn.aitutor.service.IDocumentIngestionService;
import com.vn.aitutor.service.LearningMaterialValidator;
import com.vn.aitutor.config.RabbitMQConfig;
import com.vn.aitutor.dto.DocumentIngestionMessage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionServiceImpl implements IDocumentIngestionService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final ICloudinaryService cloudinaryService;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;
    private final LearningMaterialValidator learningMaterialValidator;
    private final CurriculumService curriculumService;

    @Override
    @Transactional
    public void ingestPdfDocument(MultipartFile file, String subject, String gradeLevel, UUID userId) throws Exception {
        learningMaterialValidator.validateSupplement(file);
        log.info("Bắt đầu xử lý nạp file: {}", file.getOriginalFilename());
        User user = requireUser(userId);
        String fileUrl = cloudinaryService.uploadDocument(file);
        Document doc = newDocument(file, file.getOriginalFilename(), fileUrl, subject, gradeLevel, null, null, user);
        documentRepository.save(doc);
        publish(doc.getId(), fileUrl);
    }

    @Override
    @Transactional
    public UUID uploadLessonDocument(
            UUID lessonId, MultipartFile file, String title, DocumentType documentType, UUID userId) throws Exception {
        learningMaterialValidator.validateSupplement(file);
        Lesson lesson = curriculumService.requireLesson(lessonId);
        Book book = lesson.getChapter().getBook();
        User user = requireUser(userId);
        String storedTitle = CurriculumCodes.requireText(title, "Tên tài liệu", 5, 100);
        String fileUrl = cloudinaryService.uploadDocument(file);
        Document doc = newDocument(file, storedTitle, fileUrl, book.getSubject(), book.getGradeLevel(), lesson, documentType, user);
        documentRepository.save(doc);
        publish(doc.getId(), fileUrl);
        return doc.getId();
    }

    private Document newDocument(
            MultipartFile file,
            String title,
            String fileUrl,
            String subject,
            String gradeLevel,
            Lesson lesson,
            DocumentType documentType,
            User user) {
        Document doc = new Document();
        doc.setTitle(title);
        doc.setFileName(file.getOriginalFilename() == null ? title : file.getOriginalFilename());
        doc.setFilePath(fileUrl);
        doc.setFileSize(file.getSize());
        doc.setFileType(file.getContentType());
        doc.setSubject(subject);
        doc.setGradeLevel(gradeLevel);
        doc.setLesson(lesson);
        doc.setDocumentType(documentType);
        doc.setStatus(DocumentStatus.PROCESSING);
        doc.setCreatedBy(user);
        return doc;
    }

    private void publish(UUID documentId, String fileUrl) {
        DocumentIngestionMessage message = DocumentIngestionMessage.builder()
                .documentId(documentId)
                .fileUrl(fileUrl)
                .build();
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.DOCUMENT_EXCHANGE,
                RabbitMQConfig.DOCUMENT_INGESTION_ROUTING_KEY,
                message);
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new com.vn.aitutor.exception.ResourceNotFoundException("Không tìm thấy người dùng"));
    }
}
