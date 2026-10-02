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
