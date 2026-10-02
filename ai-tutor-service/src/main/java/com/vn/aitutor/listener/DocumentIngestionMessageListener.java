package com.vn.aitutor.listener;

import com.vn.aitutor.config.RabbitMQConfig;
import com.vn.aitutor.dto.DocumentIngestionMessage;
import com.vn.aitutor.service.DocumentIngestionProcessor;
import com.vn.aitutor.service.DocumentStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionMessageListener {

    private final DocumentIngestionProcessor documentIngestionProcessor;
    private final DocumentStatusService documentStatusService;

    @RabbitListener(queues = RabbitMQConfig.DOCUMENT_INGESTION_QUEUE)
    public void processDocument(DocumentIngestionMessage message) {
        try {
            documentIngestionProcessor.ingest(message);
        } catch (RuntimeException ex) {
            log.error("Ingestion thất bại cho tài liệu {}", message.getDocumentId(), ex);
            documentStatusService.markFailed(message.getDocumentId(), ex.getMessage());
        }
    }
}
