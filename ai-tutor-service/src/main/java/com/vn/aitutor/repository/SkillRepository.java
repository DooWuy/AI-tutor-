package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Skill;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SkillRepository extends JpaRepository<Skill, UUID> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    Optional<Skill> findByCode(String code);

    @Query("""
            SELECT s FROM Skill s
            WHERE (:keyword IS NULL OR :keyword = '' OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(s.code) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:subject IS NULL OR :subject = '' OR LOWER(s.subject) = LOWER(:subject))
              AND (:gradeLevel IS NULL OR :gradeLevel = '' OR s.gradeLevel = :gradeLevel)
            """)
    Page<Skill> searchSkills(
            @Param("keyword") String keyword,
            @Param("subject") String subject,
            @Param("gradeLevel") String gradeLevel,
            Pageable pageable
    );

    @Query("""
            SELECT s FROM Skill s
            WHERE (:subject IS NULL OR :subject = '' OR LOWER(s.subject) = LOWER(:subject))
              AND (:gradeLevel IS NULL OR :gradeLevel = '' OR s.gradeLevel = :gradeLevel)
            ORDER BY s.code ASC
            """)
    List<Skill> findBySubjectAndGradeLevel(
            @Param("subject") String subject,
            @Param("gradeLevel") String gradeLevel
    );
}
