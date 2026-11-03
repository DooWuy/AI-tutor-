package com.vn.aitutor.service.curriculum;

import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.enums.DocumentStatus;
import com.vn.aitutor.repository.DocumentRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentStatusService {

    private final DocumentRepository documentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(UUID documentId, String reason) {
        documentRepository.lockById(documentId).ifPresent(doc -> {
            if (doc.getStatus() != DocumentStatus.PROCESSING) return;
            doc.setStatus(DocumentStatus.FAILED);
            doc.setErrorMessage(trim(reason));
            documentRepository.save(doc);
            try { send(doc, reason); } catch (RuntimeException ex) { log.warn("Progress delivery failed for {}",documentId); }
            log.warn("Tài liệu {} chuyển FAILED: {}", documentId, reason);
        });
    }

    private void send(Document doc, String reason) {
        if (doc.getCreatedBy() == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("documentId", doc.getId().toString());
        payload.put("progress", -1);
        payload.put("message", "Xử lý tài liệu thất bại. Mã tài liệu: " + doc.getId());
        messagingTemplate.convertAndSendToUser(
                doc.getCreatedBy().getId().toString(), "/queue/document-progress", payload);
    }

    private String trim(String reason) {
        if (reason == null || reason.isBlank()) {
            return "Xử lý tài liệu thất bại";
        }
        String trimmed = reason.trim();
        return trimmed.length() > 2000 ? trimmed.substring(0, 2000) : trimmed;
    }
}
