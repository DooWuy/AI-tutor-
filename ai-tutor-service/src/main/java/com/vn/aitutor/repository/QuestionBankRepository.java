package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuestionBankItem;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.entity.enums.ReviewStatus;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionBankRepository extends JpaRepository<QuestionBankItem, UUID> {

    boolean existsByLessonId(UUID lessonId);

    long countByIdIn(Collection<UUID> ids);

    @EntityGraph(attributePaths = "choices")
    @Query("""
            select q from QuestionBankItem q
            where q.lesson.id = :lessonId and q.reviewStatus = :status
            order by q.createdAt desc
            """)
    List<QuestionBankItem> findByLessonAndStatus(
            @Param("lessonId") UUID lessonId, @Param("status") ReviewStatus status);

    @EntityGraph(attributePaths = "choices")
    List<QuestionBankItem> findByBatchIdAndReviewStatusOrderByCreatedAtAsc(UUID batchId, ReviewStatus status);

    @EntityGraph(attributePaths = "choices")
    @Query("""
            select q from QuestionBankItem q
            join q.lesson lesson
            join lesson.chapter chapter
            join chapter.book book
            where q.reviewStatus = com.vn.aitutor.entity.enums.ReviewStatus.ACTIVE
              and q.questionType = :type
              and q.difficulty between :minDifficulty and :maxDifficulty
              and book.subject = :subject
              and book.gradeLevel = :gradeLevel
              and (:excludedEmpty = true or q.id not in :excludedIds)
            order by q.createdAt desc
            """)
    List<QuestionBankItem> findActiveForQuiz(
            @Param("type") QuestionType type,
            @Param("minDifficulty") int minDifficulty,
            @Param("maxDifficulty") int maxDifficulty,
            @Param("subject") String subject,
            @Param("gradeLevel") String gradeLevel,
            @Param("excludedEmpty") boolean excludedEmpty,
            @Param("excludedIds") Collection<UUID> excludedIds);
}
