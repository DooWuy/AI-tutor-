package com.vn.aitutor.service.impl;

import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.DocumentChunk;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.DocumentStatus;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.DocumentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.ICloudinaryService;
import com.vn.aitutor.service.IDocumentIngestionService;
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
    private final DocumentChunkRepository documentChunkRepository;
    private final com.vn.aitutor.repository.UserRepository userRepository;
    private final ICloudinaryService cloudinaryService;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @Override
    @Transactional
    public void ingestPdfDocument(MultipartFile file, String subject, String gradeLevel, UUID userId) throws Exception {
        log.info("Bắt đầu xử lý nạp file PDF: {}", file.getOriginalFilename());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("Đang tải file lên Cloudinary...");
        String fileUrl = cloudinaryService.uploadDocument(file);
        log.info("Tải file thành công, URL: {}", fileUrl);

        Document doc = new Document();
        doc.setTitle(file.getOriginalFilename());
        doc.setFileName(file.getOriginalFilename());
        doc.setFilePath(fileUrl);
        doc.setFileSize(file.getSize());
        doc.setFileType(file.getContentType());
        doc.setSubject(subject);
        doc.setGradeLevel(gradeLevel);
        doc.setStatus(DocumentStatus.PROCESSING);
        doc.setCreatedBy(user);
        documentRepository.save(doc);

        // Đẩy message vào RabbitMQ Queue
        DocumentIngestionMessage message = DocumentIngestionMessage.builder()
                .documentId(doc.getId())
                .fileUrl(fileUrl)
                .build();
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.DOCUMENT_EXCHANGE,
                RabbitMQConfig.DOCUMENT_INGESTION_ROUTING_KEY,
                message
        );
    }
}
