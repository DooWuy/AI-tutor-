package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.repository.projection.SkillSummaryRow;
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

    @Query("""
            select l from Lesson l
            join fetch l.chapter chapter
            join fetch chapter.book
            where l.id = :id
            """)
    Optional<Lesson> findWithBook(@Param("id") UUID id);

    @Query(
            value = """
                    SELECT l.id AS lessonId,
                           l.lesson_code AS lessonCode,
                           l.title AS title,
                           b.subject AS subject,
                           b.grade_level AS gradeLevel,
                           COALESCE(qc.question_count, 0) AS questionCount
                    FROM lessons l
                    JOIN chapters c ON c.id = l.chapter_id
                    JOIN books b ON b.id = c.book_id
                    LEFT JOIN (
                        SELECT lesson_id, COUNT(*) AS question_count
                        FROM question_bank
                        WHERE review_status = 'ACTIVE'
                        GROUP BY lesson_id
                    ) qc ON qc.lesson_id = l.id
                    WHERE (:subject IS NULL OR b.subject = :subject)
                      AND (:gradeLevel IS NULL OR b.grade_level = :gradeLevel)
                    ORDER BY b.subject, b.grade_level, c.display_order, l.display_order, l.title
                    """,
            nativeQuery = true)
    List<SkillSummaryRow> findSkills(
            @Param("subject") String subject, @Param("gradeLevel") String gradeLevel);
}
