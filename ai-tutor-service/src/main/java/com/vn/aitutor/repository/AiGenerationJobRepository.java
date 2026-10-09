package com.vn.aitutor.repository;

import com.vn.aitutor.entity.AiGenerationJob;
import com.vn.aitutor.entity.enums.GenerationJobKind;
import com.vn.aitutor.entity.enums.GenerationJobStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiGenerationJobRepository extends JpaRepository<AiGenerationJob, UUID> {

    Optional<AiGenerationJob> findFirstByRequestedByIdAndLessonIdAndKindAndStatusInOrderByCreatedAtDesc(
            UUID requestedById,
            UUID lessonId,
            GenerationJobKind kind,
            Collection<GenerationJobStatus> statuses);

    Optional<AiGenerationJob> findFirstByRequestedByIdAndQuizIdAndKindAndStatusInOrderByCreatedAtDesc(
            UUID requestedById,
            UUID quizId,
            GenerationJobKind kind,
            Collection<GenerationJobStatus> statuses);

    List<AiGenerationJob> findByBatchId(UUID batchId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update AiGenerationJob j
            set j.status = com.vn.aitutor.entity.enums.GenerationJobStatus.FAILED,
                j.message = :message,
                j.finishedAt = :finishedAt
            where j.status = com.vn.aitutor.entity.enums.GenerationJobStatus.RUNNING
            """)
    int failRunning(@Param("message") String message, @Param("finishedAt") Instant finishedAt);
}
