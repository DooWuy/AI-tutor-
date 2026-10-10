package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuizAttemptDraft;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;

public interface QuizAttemptDraftRepository extends JpaRepository<QuizAttemptDraft, UUID> {
    Optional<QuizAttemptDraft> findByStudentIdAndQuizIdAndCompletedAtIsNull(UUID studentId, UUID quizId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM QuizAttemptDraft d WHERE d.id = :id")
    Optional<QuizAttemptDraft> lockById(UUID id);
    @Query("SELECT d.student.id FROM QuizAttemptDraft d WHERE d.id = :id")
    Optional<UUID> findStudentId(UUID id);
    @Query("SELECT d.id FROM QuizAttemptDraft d WHERE d.completedAt IS NULL AND d.expiresAt <= :now ORDER BY d.expiresAt")
    List<UUID> findExpired(Instant now, Pageable pageable);
}
