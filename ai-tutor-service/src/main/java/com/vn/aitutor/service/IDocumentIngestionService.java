package com.vn.aitutor.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

public interface IDocumentIngestionService {
    /**
     * Upload and ingest a PDF document.
     * 1. Upload to Cloudinary.
     * 2. Parse PDF.
     * 3. Chunk the text.
     * 4. Generate embeddings.
     * 5. Save to database (pgvector).
     * @param file the multipart file (PDF)
     * @param subject the subject of the document
     * @param gradeLevel the grade level
     * @param userId the ID of the user (admin/teacher) uploading the document
     */
    void ingestPdfDocument(MultipartFile file, String subject, String gradeLevel, UUID userId) throws Exception;
}
