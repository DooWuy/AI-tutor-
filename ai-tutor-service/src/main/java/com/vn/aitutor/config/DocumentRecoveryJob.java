package com.vn.aitutor.config;
import com.vn.aitutor.repository.DocumentRepository;
import com.vn.aitutor.dto.message.DocumentIngestionMessage;
import com.vn.aitutor.entity.enums.DocumentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
@Component
@RequiredArgsConstructor
public class DocumentRecoveryJob {
    private final DocumentRepository documents;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbit;
    @Scheduled(fixedDelayString="${app.documents.recovery-ms:300000}")
    public void recover() {
        documents.findByStatusAndCreatedAtBefore(DocumentStatus.PROCESSING,java.time.Instant.now().minusSeconds(300),org.springframework.data.domain.PageRequest.of(0,50))
            .forEach(d -> rabbit.convertAndSend(RabbitMQConfig.DOCUMENT_EXCHANGE,RabbitMQConfig.DOCUMENT_INGESTION_ROUTING_KEY,
                DocumentIngestionMessage.builder().documentId(d.getId()).fileUrl(d.getFilePath()).build()));
    }
}
