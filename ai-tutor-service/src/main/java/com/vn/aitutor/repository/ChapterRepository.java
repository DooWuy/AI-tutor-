package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Chapter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChapterRepository extends JpaRepository<Chapter, UUID> {

    List<Chapter> findByBookIdOrderByDisplayOrderAsc(UUID bookId);

    boolean existsByBookId(UUID bookId);

    boolean existsByBookIdAndChapterCode(UUID bookId, String chapterCode);

    Optional<Chapter> findByBookIdAndChapterCode(UUID bookId, String chapterCode);

    Optional<Chapter> findByBookIdAndTitleIgnoreCase(UUID bookId, String title);

    @Query("select coalesce(max(c.displayOrder), 0) from Chapter c where c.book.id = :bookId")
    int maxDisplayOrder(@Param("bookId") UUID bookId);
}
