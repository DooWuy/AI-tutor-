package com.vn.aitutor.repository;

import com.vn.aitutor.entity.ChatSession;
import com.vn.aitutor.repository.projection.DaySecondsRow;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {

    @Query(
            value = """
                    SELECT COALESCE(SUM(
                        LEAST(
                            7200,
                            GREATEST(
                                0,
                                EXTRACT(EPOCH FROM (
                                    LEAST(COALESCE(cs.last_message_at, cs.created_at), CAST(:toTs AS timestamptz))
                                    - GREATEST(cs.created_at, CAST(:fromTs AS timestamptz))
                                ))
                            )
                        )
                    ), 0)::bigint
                    FROM chat_sessions cs
                    JOIN students s ON s.id = cs.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                      AND cs.created_at <= CAST(:toTs AS timestamptz)
                      AND COALESCE(cs.last_message_at, cs.created_at) >= CAST(:fromTs AS timestamptz)
                      AND (:subject IS NULL OR cs.subject = :subject)
                    """,
            nativeQuery = true)
    Long sumCappedChatSeconds(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);

    @Query(
            value = """
                    SELECT EXTRACT(ISODOW FROM (
                               COALESCE(cs.last_message_at, cs.created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh'
                           ))::int AS dayOfWeek,
                           COALESCE(SUM(
                               LEAST(
                                   7200,
                                   GREATEST(
                                       0,
                                       EXTRACT(EPOCH FROM (
                                           LEAST(COALESCE(cs.last_message_at, cs.created_at), CAST(:toTs AS timestamptz))
                                           - GREATEST(cs.created_at, CAST(:fromTs AS timestamptz))
                                       ))
                                   )
                               )
                           ), 0)::bigint AS totalSeconds
                    FROM chat_sessions cs
                    JOIN students s ON s.id = cs.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                      AND cs.created_at <= CAST(:toTs AS timestamptz)
                      AND COALESCE(cs.last_message_at, cs.created_at) >= CAST(:fromTs AS timestamptz)
                      AND (:subject IS NULL OR cs.subject = :subject)
                    GROUP BY 1
                    """,
            nativeQuery = true)
    List<DaySecondsRow> chatSecondsByWeekday(
            @Param("classId") UUID classId,
            @Param("fromTs") Instant fromTs,
            @Param("toTs") Instant toTs,
            @Param("subject") String subject);
}
