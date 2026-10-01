package com.vn.aitutor.listener;

import com.vn.aitutor.config.RabbitMQConfig;
import com.vn.aitutor.dto.DocumentIngestionMessage;
import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.DocumentChunk;
import com.vn.aitutor.entity.enums.DocumentStatus;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.DocumentRepository;
import java.io.File;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.data.document.BlankDocumentException;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;

import com.vn.aitutor.service.ILlamaParseService;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionMessageListener {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ILlamaParseService llamaParseService;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmbeddingModel embeddingModel = new AllMiniLmL6V2EmbeddingModel();

    @RabbitListener(queues = RabbitMQConfig.DOCUMENT_INGESTION_QUEUE)
    @Transactional
    public void processDocument(DocumentIngestionMessage message) {
        Document doc = documentRepository.findById(message.getDocumentId())
                .orElseThrow(() -> new RuntimeException("Document not found"));
        String fileUrl = message.getFileUrl();
        String userId = doc.getCreatedBy().getId().toString();

        // Gửi thông báo bắt đầu qua WebSocket
        sendProgressUpdate(userId, doc.getId().toString(), 10, "Bắt đầu bóc tách văn bản qua LlamaParse...");

        // Lấy đường dẫn file vật lý từ fileUrl (bỏ dấu '/' ở đầu)
        File localFile = new File(fileUrl.substring(1));
        
        try {
            // 3. Parse PDF bằng LlamaParse
            log.info("Đang gọi LlamaParse để bóc tách file: {}", localFile.getName());
            String markdown = llamaParseService.parsePdfToMarkdown(localFile);
            var parsedDoc = dev.langchain4j.data.document.Document.from(markdown);

            // 4. Chunk the text
            List<TextSegment> segments = DocumentSplitters.recursive(500, 50).split(parsedDoc);

            sendProgressUpdate(userId, doc.getId().toString(), 40, "Bóc tách thành công, bắt đầu Vector hóa " + segments.size() + " đoạn...");

            // 5. Embed and save chunks
            log.info("Bắt đầu cắt file PDF thành {} đoạn nhỏ và tạo Vector Nhúng...", segments.size());
            int index = 0;
            List<DocumentChunk> chunksToSave = new ArrayList<>();
            for (TextSegment segment : segments) {
                if (index % 10 == 0) {
                    int progress = 40 + (int) ((index * 50.0) / segments.size());
                    sendProgressUpdate(userId, doc.getId().toString(), progress, "Đang Vector hóa đoạn " + index + "/" + segments.size());
                    log.info("Đang tạo Vector cho đoạn {}/{}", index, segments.size());
                }
                float[] embedding = embeddingModel.embed(segment.text()).content().vector();

                DocumentChunk chunk = new DocumentChunk();
                chunk.setDocument(doc);
                chunk.setChunkIndex(index++);
                chunk.setContent(segment.text());
                chunk.setEmbedding(embedding);
                
                // Add metadata (citations)
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("source", doc.getFileName());
                metadata.put("subject", doc.getSubject());
                metadata.put("url", fileUrl);
                chunk.setMetadata(metadata);

                chunksToSave.add(chunk);
            }
            
            // Bulk insert all chunks at once for better performance
            documentChunkRepository.saveAll(chunksToSave);

            // Update status
            doc.setStatus(DocumentStatus.SUCCESS);
            doc.setProgressPercentage(100);
            documentRepository.save(doc);
            
            sendProgressUpdate(userId, doc.getId().toString(), 100, "Hoàn tất! Tài liệu đã sẵn sàng.");
            log.info("Successfully ingested document: {}", doc.getFileName());
        } catch (BlankDocumentException e) {
            log.error("Blank document (no text found) for file: {}", doc.getFileName());
            doc.setStatus(DocumentStatus.FAILED);
            documentRepository.save(doc);
            sendProgressUpdate(doc.getCreatedBy().getId().toString(), doc.getId().toString(), -1, "Lỗi: File rỗng hoặc không chứa văn bản hợp lệ.");
        } catch (Exception e) {
            log.error("Failed to process document", e);
            doc.setStatus(DocumentStatus.FAILED);
            documentRepository.save(doc);
            sendProgressUpdate(doc.getCreatedBy().getId().toString(), doc.getId().toString(), -1, "Lỗi khi xử lý tài liệu: " + e.getMessage());
        }
    }

    private void sendProgressUpdate(String userId, String documentId, int progress, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", documentId);
        payload.put("progress", progress);
        payload.put("message", message);
        messagingTemplate.convertAndSendToUser(userId, "/queue/document-progress", payload);
    }
}
