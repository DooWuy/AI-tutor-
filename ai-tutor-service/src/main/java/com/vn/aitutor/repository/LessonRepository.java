package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Lesson;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findByChapterIdOrderByDisplayOrderAsc(UUID chapterId);

    boolean existsByChapterId(UUID chapterId);

    boolean existsByLessonCode(String lessonCode);

    Optional<Lesson> findByChapterIdAndLessonCode(UUID chapterId, String lessonCode);

    Optional<Lesson> findByChapterIdAndTitleIgnoreCase(UUID chapterId, String title);

    @Query("select coalesce(max(l.displayOrder), 0) from Lesson l where l.chapter.id = :chapterId")
    int maxDisplayOrder(@Param("chapterId") UUID chapterId);

    @Query("select l.lessonCode from Lesson l where l.lessonCode like 'L%'")
    List<String> findGeneratedLessonCodes();
}
