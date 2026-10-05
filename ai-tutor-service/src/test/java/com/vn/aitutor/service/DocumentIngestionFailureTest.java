package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.DocumentIngestionMessage;
import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.DocumentStatus;
import com.vn.aitutor.exception.IngestionException;
import com.vn.aitutor.listener.DocumentIngestionMessageListener;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.DocumentRepository;
import java.io.File;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class DocumentIngestionFailureTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentChunkRepository documentChunkRepository;
    @Mock
    private ICloudinaryService cloudinaryService;
    @Mock
    private DocumentTextExtractor textExtractor;
    @Mock
    private ChunkEmbeddingService embeddingService;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @InjectMocks
    private DocumentIngestionProcessor processor;

    @Test
    void embeddingFailureDoesNotSaveChunksAndLeavesTheDocumentUnchanged() throws Exception {
        UUID documentId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User owner = new User();
        owner.setId(userId);
        Document document = new Document();
        document.setId(documentId);
        document.setTitle("Đạo hàm");
        document.setFileName("dao-ham.pdf");
        document.setFilePath("/uploads/documents/dao-ham.pdf");
        document.setSubject("TOAN");
        document.setGradeLevel("12");
        document.setStatus(DocumentStatus.PROCESSING);
        document.setCreatedBy(owner);
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(cloudinaryService.materialize(document.getFilePath())).thenReturn(File.createTempFile("aitutor-", ".pdf"));
        when(textExtractor.extract(any(), any())).thenReturn("Công thức $$\\int_{a}^{b} f(x) dx$$");
        when(embeddingService.embed(any())).thenThrow(new IngestionException("hạn mức"));

        IngestionException error = assertThrows(IngestionException.class,
                () -> processor.ingest(DocumentIngestionMessage.builder().documentId(documentId).fileUrl(document.getFilePath()).build()));

        assertEqualsMessage("hạn mức", error.getMessage());
        verify(documentChunkRepository, never()).saveAll(any());
        verify(documentRepository, never()).save(document);
        verify(messagingTemplate, atLeastOnce()).convertAndSendToUser(
                eq(userId.toString()), eq("/queue/document-progress"), any());
    }

    @Test
    void listenerMarksTheDocumentFailedAfterTheProcessorRollsBack() {
        DocumentIngestionProcessor ingestionProcessor = org.mockito.Mockito.mock(DocumentIngestionProcessor.class);
        DocumentStatusService statusService = org.mockito.Mockito.mock(DocumentStatusService.class);
        DocumentIngestionMessageListener listener = new DocumentIngestionMessageListener(ingestionProcessor, statusService);
        UUID documentId = UUID.randomUUID();
        DocumentIngestionMessage message = DocumentIngestionMessage.builder().documentId(documentId).build();
        org.mockito.Mockito.doThrow(new IngestionException("hạn mức")).when(ingestionProcessor).ingest(message);

        listener.processDocument(message);

        verify(statusService).markFailed(documentId, "hạn mức");
    }

    private static void assertEqualsMessage(String expected, String actual) {
        org.junit.jupiter.api.Assertions.assertEquals(expected, actual);
    }
}
