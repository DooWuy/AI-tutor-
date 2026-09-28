package com.vn.aitutor.repository;

import com.vn.aitutor.entity.StudyNotification;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StudyNotificationRepository extends JpaRepository<StudyNotification, UUID> {

    boolean existsBySlot_IdAndLessonDate(UUID slotId, LocalDate lessonDate);

    List<StudyNotification> findByStudent_IdOrderByCreatedAtDesc(UUID studentId, Pageable pageable);

    long countByStudent_IdAndReadAtIsNull(UUID studentId);

    @Query("""
            SELECT n FROM StudyNotification n
            WHERE n.id = :id AND n.student.user.id = :userId
            """)
    Optional<StudyNotification> findOwned(@Param("id") UUID id, @Param("userId") UUID userId);

    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE StudyNotification n
            SET n.readAt = :readAt
            WHERE n.student.id = :studentId AND n.readAt IS NULL
            """)
    int markAllRead(@Param("studentId") UUID studentId, @Param("readAt") Instant readAt);
}
