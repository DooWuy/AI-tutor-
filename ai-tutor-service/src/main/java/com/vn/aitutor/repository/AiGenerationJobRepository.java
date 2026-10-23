package com.vn.aitutor.repository;

import com.vn.aitutor.entity.AiGenerationJob;
import com.vn.aitutor.entity.enums.GenerationJobKind;
import com.vn.aitutor.entity.enums.GenerationJobStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiGenerationJobRepository extends JpaRepository<AiGenerationJob, UUID> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select j from AiGenerationJob j where j.id = :id")
    Optional<AiGenerationJob> lockById(@Param("id") UUID id);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    List<AiGenerationJob> findByStatusOrderByIdAsc(GenerationJobStatus status);

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

}
