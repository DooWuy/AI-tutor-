package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Document;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Document d where d.id=:id")
    java.util.Optional<Document> lockById(@Param("id") UUID id);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths={"createdBy", "lesson"})
    @Query("select d from Document d where (:owner is null or d.createdBy.id=:owner) and (:status is null or d.status=:status) and (:subject is null or d.subject=:subject) and (:grade is null or d.gradeLevel=:grade) and (:search is null or lower(d.title) like lower(concat('%',cast(:search as string),'%')) or lower(d.fileName) like lower(concat('%',cast(:search as string),'%')) or lower(d.createdBy.fullName) like lower(concat('%',cast(:search as string),'%')))")
    org.springframework.data.domain.Page<Document> browse(@Param("owner") UUID owner, @Param("status") com.vn.aitutor.entity.enums.DocumentStatus status,
        @Param("subject") String subject, @Param("grade") String grade, @Param("search") String search, org.springframework.data.domain.Pageable page);

    java.util.List<Document> findByStatusAndCreatedAtBefore(com.vn.aitutor.entity.enums.DocumentStatus status, java.time.Instant cutoff, org.springframework.data.domain.Pageable page);
    boolean existsByLessonId(UUID lessonId);

    @Query("""
            select d from Document d
            left join d.lesson lesson
            left join lesson.chapter chapter
            left join chapter.book book
            where (:lessonId is null or lesson.id = :lessonId)
              and (:bookId is null or book.id = :bookId)
              and (:ownerId is null or d.createdBy.id = :ownerId)
            order by d.createdAt desc
            """)
    List<Document> search(
            @Param("lessonId") UUID lessonId,
            @Param("bookId") UUID bookId,
            @Param("ownerId") UUID ownerId);
}
