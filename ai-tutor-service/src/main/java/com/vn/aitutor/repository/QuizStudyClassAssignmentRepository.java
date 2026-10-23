package com.vn.aitutor.repository;

import com.vn.aitutor.entity.QuizStudyClassAssignment;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizStudyClassAssignmentRepository extends JpaRepository<QuizStudyClassAssignment, UUID> {

    @Modifying(flushAutomatically = true)
    @Query("delete from QuizStudyClassAssignment a where a.quiz.id = :quizId")
    void deleteByQuizId(@Param("quizId") UUID quizId);

    @Query("""
            select a from QuizStudyClassAssignment a
            join fetch a.studyClass
            where a.quiz.id in :quizIds
            """)
    List<QuizStudyClassAssignment> findByQuizIdIn(@Param("quizIds") Collection<UUID> quizIds);

    @Query("""
            select case when count(a) > 0 then true else false end
            from QuizStudyClassAssignment a
            where a.quiz.id = :quizId
              and a.studyClass.status = com.vn.aitutor.entity.enums.StudyClassStatus.ACTIVE
              and exists (
                select e.id from StudyClassEnrollment e
                where e.studyClass = a.studyClass
                  and e.student.id = :studentId
                  and e.status = com.vn.aitutor.entity.enums.EnrollmentStatus.APPROVED
              )
            """)
    boolean existsApprovedActive(@Param("quizId") UUID quizId, @Param("studentId") UUID studentId);
}
