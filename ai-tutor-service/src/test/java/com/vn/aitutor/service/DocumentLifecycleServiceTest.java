package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.request.DocumentMetadataRequest;
import com.vn.aitutor.dto.response.DocumentSummaryResponse;
import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.DocumentStatus;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.DocumentRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DocumentLifecycleServiceTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private DocumentChunkRepository documentChunkRepository;
    @Mock
    private ICloudinaryService cloudinaryService;
    @InjectMocks
    private DocumentLifecycleService service;

    @Test
    void updatesSubjectAndGradeThenSyncsEveryChunk() {
        UUID documentId = UUID.randomUUID();
        User admin = user(Role.ADMIN);
        Document document = document(documentId, admin);
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        DocumentMetadataRequest request = new DocumentMetadataRequest();
        request.setSubject("Vật lý");
        request.setGradeLevel("Khối 11");

        DocumentSummaryResponse summary = service.updateMetadata(documentId, request, principal(admin));

        assertEquals("LY", summary.getSubject());
        assertEquals("11", summary.getGradeLevel());
        verify(documentChunkRepository).syncMetadata(documentId, "Sách Bài Tập Toán 10", "LY", "11");
    }

    @Test
    void teacherCannotRelabelSomeoneElsesDocument() {
        UUID documentId = UUID.randomUUID();
        Document document = document(documentId, user(Role.TEACHER));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        DocumentMetadataRequest request = new DocumentMetadataRequest();
        request.setSubject("LY");

        assertThrows(ResourceForbiddenException.class,
                () -> service.updateMetadata(documentId, request, principal(user(Role.TEACHER))));
        verify(documentChunkRepository, never()).syncMetadata(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void deleteRemovesTheFileChunksAndDocumentEvenWhenTheFileIsAlreadyGone() {
        UUID documentId = UUID.randomUUID();
        User admin = user(Role.ADMIN);
        Document document = document(documentId, admin);
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        doThrow(new RuntimeException("missing")).when(cloudinaryService).deleteStoredFile(document.getFilePath());

        service.delete(documentId, principal(admin));

        verify(documentChunkRepository).deleteByDocumentId(documentId);
        verify(documentRepository).delete(document);
    }

    private static Document document(UUID id, User owner) {
        Document document = new Document();
        document.setId(id);
        document.setTitle("Sách Bài Tập Toán 10");
        document.setFileName("toan.pdf");
        document.setFilePath("/uploads/documents/toan.pdf");
        document.setSubject("TOAN");
        document.setGradeLevel("10");
        document.setStatus(DocumentStatus.SUCCESS);
        document.setCreatedBy(owner);
        return document;
    }

    private static User user(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        return user;
    }

    private static UserPrincipal principal(User user) {
        return UserPrincipal.builder().users(user).build();
    }
}
