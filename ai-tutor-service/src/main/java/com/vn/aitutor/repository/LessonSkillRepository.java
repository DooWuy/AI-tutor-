package com.vn.aitutor.repository;

import com.vn.aitutor.entity.LessonSkill;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LessonSkillRepository extends JpaRepository<LessonSkill, UUID> {

    List<LessonSkill> findBySkillId(UUID skillId);

    List<LessonSkill> findByLessonId(UUID lessonId);

    Optional<LessonSkill> findByLessonIdAndSkillId(UUID lessonId, UUID skillId);

    boolean existsByLessonIdAndSkillId(UUID lessonId, UUID skillId);

    @Modifying
    @Query("DELETE FROM LessonSkill ls WHERE ls.skill.id = :skillId")
    void deleteBySkillId(@Param("skillId") UUID skillId);

    @Modifying
    @Query("DELETE FROM LessonSkill ls WHERE ls.skill.id = :skillId AND ls.lesson.id NOT IN :lessonIds")
    void deleteBySkillIdAndLessonIdNotIn(@Param("skillId") UUID skillId, @Param("lessonIds") Collection<UUID> lessonIds);

    @Query("SELECT ls.lesson.id FROM LessonSkill ls WHERE ls.skill.id = :skillId")
    List<UUID> findLessonIdsBySkillId(@Param("skillId") UUID skillId);

    @Query("SELECT ls.skill.id FROM LessonSkill ls WHERE ls.lesson.id = :lessonId")
    List<UUID> findSkillIdsByLessonId(@Param("lessonId") UUID lessonId);
}
