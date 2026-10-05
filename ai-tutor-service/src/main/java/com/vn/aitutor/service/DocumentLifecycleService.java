package com.vn.aitutor.service;

import com.vn.aitutor.curriculum.CurriculumCodes;
import com.vn.aitutor.curriculum.GradeLevels;
import com.vn.aitutor.dto.request.DocumentMetadataRequest;
import com.vn.aitutor.dto.response.DocumentSummaryResponse;
import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.DocumentRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentLifecycleService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ICloudinaryService cloudinaryService;

    @Transactional(readOnly = true)
    public List<DocumentSummaryResponse> list(UUID lessonId, UUID bookId, UserPrincipal principal) {
        UUID ownerId = isAdmin(principal) ? null : principal.getUsers().getId();
        return documentRepository.search(lessonId, bookId, ownerId).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public DocumentSummaryResponse updateMetadata(UUID documentId, DocumentMetadataRequest request, UserPrincipal principal) {
        Document document = require(documentId);
        assertCanManage(document, principal);
        if (request == null
                || isBlank(request.getTitle()) && isBlank(request.getSubject()) && isBlank(request.getGradeLevel())) {
            throw new ResourceBadRequestException("Cần ít nhất một trường để cập nhật");
        }
        if (!isBlank(request.getTitle())) {
            document.setTitle(CurriculumCodes.requireText(request.getTitle(), "Tên tài liệu", 2, 255));
        }
        if (!isBlank(request.getSubject())) {
            document.setSubject(SubjectCode.parseRequired(request.getSubject()).name());
        }
        if (!isBlank(request.getGradeLevel())) {
            document.setGradeLevel(GradeLevels.normalize(request.getGradeLevel()));
        }
        documentRepository.saveAndFlush(document);
        DocumentSummaryResponse summary = toSummary(document);
        documentChunkRepository.syncMetadata(
                document.getId(),
                safe(document.getTitle()),
                safe(document.getSubject()),
                safe(document.getGradeLevel()));
        return summary;
    }

    @Transactional
    public void delete(UUID documentId, UserPrincipal principal) {
        Document document = require(documentId);
        assertCanManage(document, principal);
        try {
            cloudinaryService.deleteStoredFile(document.getFilePath());
        } catch (RuntimeException ex) {
            log.warn("Không xóa được file của tài liệu {}: {}", documentId, ex.getMessage());
        }
        documentChunkRepository.deleteByDocumentId(document.getId());
        documentRepository.delete(document);
    }

    private Document require(UUID documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));
    }

    private void assertCanManage(Document document, UserPrincipal principal) {
        if (isAdmin(principal)) {
            return;
        }
        if (document.getCreatedBy() == null
                || !document.getCreatedBy().getId().equals(principal.getUsers().getId())) {
            throw new ResourceForbiddenException("Bạn không có quyền thao tác tài liệu này");
        }
    }

    private boolean isAdmin(UserPrincipal principal) {
        return principal.getUsers().getRole() == Role.ADMIN;
    }

    private DocumentSummaryResponse toSummary(Document document) {
        return DocumentSummaryResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .fileName(document.getFileName())
                .subject(document.getSubject())
                .gradeLevel(document.getGradeLevel())
                .status(document.getStatus().name())
                .progressPercentage(document.getProgressPercentage())
                .documentType(document.getDocumentType() == null ? null : document.getDocumentType().name())
                .lessonId(document.getLesson() == null ? null : document.getLesson().getId())
                .errorMessage(document.getErrorMessage())
                .createdAt(document.getCreatedAt())
                .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
