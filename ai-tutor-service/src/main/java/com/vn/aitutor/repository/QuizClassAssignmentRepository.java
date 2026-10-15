package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuizClassAssignment;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizClassAssignmentRepository extends JpaRepository<QuizClassAssignment, UUID> {

    @Modifying(flushAutomatically = true)
    @Query("delete from QuizClassAssignment a where a.quiz.id = :quizId")
    void deleteByQuizId(@Param("quizId") UUID quizId);

    @Query("""
            select a from QuizClassAssignment a
            join fetch a.schoolClass
            where a.quiz.id in :quizIds
            """)
    List<QuizClassAssignment> findByQuizIdIn(@Param("quizIds") Collection<UUID> quizIds);

    boolean existsByQuiz_IdAndSchoolClass_Id(UUID quizId, UUID classId);
}
