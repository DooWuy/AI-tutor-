package com.vn.aitutor.service;

import com.vn.aitutor.curriculum.LatexAwareSplitter;
import com.vn.aitutor.dto.DocumentIngestionMessage;
import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.DocumentChunk;
import com.vn.aitutor.entity.enums.DocumentStatus;
import com.vn.aitutor.exception.IngestionException;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.DocumentRepository;
import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionProcessor {

    private static final int EMBED_BATCH = 100;

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ICloudinaryService cloudinaryService;
    private final DocumentTextExtractor textExtractor;
    private final ChunkEmbeddingService embeddingService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void ingest(DocumentIngestionMessage message) {
        Document doc = documentRepository.findById(message.getDocumentId())
                .orElseThrow(() -> new IngestionException("Không tìm thấy tài liệu"));
        String userId = doc.getCreatedBy().getId().toString();
        send(userId, doc, 0, "Bắt đầu xử lý tài liệu");
        File local = null;
        boolean temporary = false;
        try {
            local = cloudinaryService.materialize(doc.getFilePath());
            temporary = doc.getFilePath() != null && doc.getFilePath().startsWith("http");
            send(userId, doc, 10, "Bóc tách văn bản");
            String text = textExtractor.extract(local, doc.getFileName());
            if (text == null || text.isBlank()) {
                throw new IngestionException("File rỗng hoặc không chứa văn bản hợp lệ");
            }
            List<String> segments = LatexAwareSplitter.split(text);
            if (segments.isEmpty()) {
                throw new IngestionException("File rỗng hoặc không chứa văn bản hợp lệ");
            }
            send(userId, doc, 40, "Bắt đầu vector hóa " + segments.size() + " đoạn");
            List<DocumentChunk> chunks = new ArrayList<>();
            int index = 0;
            for (int offset = 0; offset < segments.size(); offset += EMBED_BATCH) {
                List<String> batch = segments.subList(offset, Math.min(offset + EMBED_BATCH, segments.size()));
                float[][] vectors = embeddingService.embed(batch);
                for (int i = 0; i < batch.size(); i++) {
                    DocumentChunk chunk = new DocumentChunk();
                    chunk.setDocument(doc);
                    chunk.setChunkIndex(index);
                    chunk.setContent(batch.get(i));
                    chunk.setEmbedding(vectors[i]);
                    chunk.setMetadata(metadata(doc));
                    chunks.add(chunk);
                    index++;
                }
                int progress = 40 + (int) ((index * 50.0) / segments.size());
                send(userId, doc, Math.min(progress, 95), "Đang vector hóa đoạn " + index + "/" + segments.size());
            }
            documentChunkRepository.saveAll(chunks);
            doc.setStatus(DocumentStatus.SUCCESS);
            doc.setProgressPercentage(100);
            doc.setErrorMessage(null);
            documentRepository.save(doc);
            send(userId, doc, 100, "Hoàn tất! Tài liệu đã sẵn sàng.");
            log.info("Đã nạp tài liệu {}", doc.getFileName());
        } catch (IngestionException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new IngestionException("Lỗi khi xử lý tài liệu: " + ex.getMessage(), ex);
        } catch (Exception ex) {
            throw new IngestionException("Lỗi khi xử lý tài liệu: " + ex.getMessage(), ex);
        } finally {
            if (temporary && local != null) {
                try {
                    Files.deleteIfExists(local.toPath());
                } catch (Exception ex) {
                    log.warn("Không xóa được file tạm {}", local.getPath());
                }
            }
        }
    }

    private Map<String, Object> metadata(Document doc) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("source", doc.getFileName());
        metadata.put("title", doc.getTitle());
        metadata.put("subject", doc.getSubject());
        metadata.put("gradeLevel", doc.getGradeLevel());
        metadata.put("url", doc.getFilePath());
        if (doc.getDocumentType() != null) {
            metadata.put("documentType", doc.getDocumentType().name());
        }
        if (doc.getLesson() != null) {
            metadata.put("lessonId", doc.getLesson().getId().toString());
            metadata.put("lessonTitle", doc.getLesson().getTitle());
        }
        return metadata;
    }

    private void send(String userId, Document doc, int progress, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", doc.getId().toString());
        payload.put("progress", progress);
        payload.put("message", message);
        messagingTemplate.convertAndSendToUser(userId, "/queue/document-progress", payload);
    }
}
