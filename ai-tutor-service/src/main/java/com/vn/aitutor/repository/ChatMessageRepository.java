package com.vn.aitutor.repository;

import com.vn.aitutor.entity.ChatMessage;
import com.vn.aitutor.repository.projection.ChatSnippetRow;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query(
            value = """
                    SELECT s.id AS studentId,
                           m.content AS content
                    FROM chat_messages m
                    JOIN chat_sessions cs ON cs.id = m.chat_session_id
                    JOIN students s ON s.id = cs.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                      AND m.sender_type = 'STUDENT'
                      AND m.created_at >= :fromTs
                      AND m.created_at <= :toTs
                      AND (:subject IS NULL OR cs.subject = :subject)
                    ORDER BY m.created_at
                    """,
            nativeQuery = true)
    List<ChatSnippetRow> findStudentMessages(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);
}
