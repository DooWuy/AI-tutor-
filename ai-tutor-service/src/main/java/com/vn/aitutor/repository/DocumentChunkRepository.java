package com.vn.aitutor.repository;

import com.vn.aitutor.entity.DocumentChunk;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {
    
    @Query(value = "SELECT * FROM document_chunks ORDER BY embedding <=> cast(:vector as vector) LIMIT :maxResults", nativeQuery = true)
    List<DocumentChunk> findTopSimilarChunks(@Param("vector") String vectorString, @Param("maxResults") int maxResults);

    @Query(value = "SELECT dc.* FROM document_chunks dc JOIN documents d ON dc.document_id = d.id " +
                   "WHERE (:subject IS NULL OR d.subject = :subject) " +
                   "AND (:gradeLevel IS NULL OR d.grade_level = :gradeLevel) " +
                   "ORDER BY dc.embedding <=> cast(:vector as vector) LIMIT :maxResults", nativeQuery = true)
    List<DocumentChunk> findTopSimilarChunksWithFilter(@Param("vector") String vectorString,
                                                       @Param("subject") String subject,
                                                       @Param("gradeLevel") String gradeLevel,
                                                       @Param("maxResults") int maxResults);

    @Modifying
    @Query("delete from DocumentChunk chunk where chunk.document.id = :documentId")
    int deleteByDocumentId(@Param("documentId") UUID documentId);

    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE document_chunks
            SET metadata = jsonb_set(
                    jsonb_set(
                        jsonb_set(COALESCE(metadata, '{}'::jsonb), '{title}', to_jsonb(CAST(:title AS text)), true),
                        '{subject}', to_jsonb(CAST(:subject AS text)), true),
                    '{gradeLevel}', to_jsonb(CAST(:gradeLevel AS text)), true)
            WHERE document_id = :documentId
            """, nativeQuery = true)
    int syncMetadata(
            @Param("documentId") UUID documentId,
            @Param("title") String title,
            @Param("subject") String subject,
            @Param("gradeLevel") String gradeLevel);
}
