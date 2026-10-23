package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.enums.QuizStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT q FROM Quiz q WHERE q.id = :id")
    Optional<Quiz> lockById(UUID id);

    Optional<Quiz> findFirstByTitle(String title);

    @Query("""
            select q from Quiz q
            join fetch q.createdBy
            left join fetch q.lesson
            where (:ownerId is null or q.createdBy.id = :ownerId)
              and (:subject is null or q.subject = :subject)
              and (:gradeLevel is null or q.gradeLevel = :gradeLevel)
              and (:status is null or q.status = :status)
            order by q.createdAt desc
            """)
    List<Quiz> search(
            @Param("ownerId") UUID ownerId,
            @Param("subject") String subject,
            @Param("gradeLevel") String gradeLevel,
            @Param("status") QuizStatus status);

    List<Quiz> findBySubjectAndAiGeneratedAndCreatedByIdOrderByCreatedAtDesc(String subject, boolean aiGenerated, UUID createdById);

    List<Quiz> findBySubjectAndAiGeneratedFalseOrderByCreatedAtDesc(String subject);

    @Query("""
            select q from Quiz q
            where q.subject = :subject
              and q.active = true
              and q.status = com.vn.aitutor.entity.enums.QuizStatus.PUBLISHED
              and q.generationStatus = 'READY'
              and exists (
                select 1 from QuizClassAssignment a
                where a.quiz = q and a.schoolClass.id = :classId
              )
            order by q.createdAt desc
            """)
    List<Quiz> findOfficialForClass(@Param("subject") String subject, @Param("classId") UUID classId);

    @Query("""
            select distinct q from Quiz q
            join fetch q.createdBy
            where q.status = com.vn.aitutor.entity.enums.QuizStatus.PUBLISHED
              and (:ownerId is null or q.createdBy.id = :ownerId)
              and exists (
                select 1 from QuizClassAssignment a
                where a.quiz = q and a.schoolClass.id = :classId
              )
            order by q.createdAt desc
            """)
    List<Quiz> findPublishedAssignedToClass(@Param("classId") UUID classId, @Param("ownerId") UUID ownerId);

    @Query("""
            select distinct q from Quiz q
            where q.subject = :subject
              and q.active = true
              and q.status = com.vn.aitutor.entity.enums.QuizStatus.PUBLISHED
              and q.generationStatus = 'READY'
              and (
                (:classId is not null and exists (
                    select a.id from QuizClassAssignment a
                    where a.quiz = q and a.schoolClass.id = :classId
                ))
                or exists (
                    select s.id from QuizStudyClassAssignment s
                    where s.quiz = q
                      and s.studyClass.status = com.vn.aitutor.entity.enums.StudyClassStatus.ACTIVE
                      and exists (
                        select e.id from StudyClassEnrollment e
                        where e.studyClass = s.studyClass
                          and e.student.id = :studentId
                          and e.status = com.vn.aitutor.entity.enums.EnrollmentStatus.APPROVED
                      )
                )
              )
            order by q.createdAt desc
            """)
    List<Quiz> findOfficialForStudent(
            @Param("subject") String subject,
            @Param("classId") UUID classId,
            @Param("studentId") UUID studentId);

    @Query("""
            select distinct q from Quiz q
            join fetch q.createdBy
            where q.status = com.vn.aitutor.entity.enums.QuizStatus.PUBLISHED
              and (:ownerId is null or q.createdBy.id = :ownerId)
              and exists (
                select a.id from QuizStudyClassAssignment a
                where a.quiz = q and a.studyClass.id = :classId
              )
            order by q.createdAt desc
            """)
    List<Quiz> findPublishedAssignedToStudyClass(@Param("classId") UUID classId, @Param("ownerId") UUID ownerId);

    @Query("""
            select q from Quiz q
            where q.active = true
              and q.status = com.vn.aitutor.entity.enums.QuizStatus.PUBLISHED
              and q.generationStatus = 'READY'
              and exists (
                select a.id from QuizStudyClassAssignment a
                where a.quiz = q
                  and a.studyClass.id = :classId
                  and a.studyClass.status = com.vn.aitutor.entity.enums.StudyClassStatus.ACTIVE
              )
            order by q.createdAt desc
            """)
    List<Quiz> findPublishedForActiveStudyClass(@Param("classId") UUID classId);

    @Query("""
            select q from Quiz q
            where q.active = true
              and q.status = com.vn.aitutor.entity.enums.QuizStatus.PUBLISHED
              and q.generationStatus = 'READY'
              and (
                (:classId is not null and exists (
                    select a.id from QuizClassAssignment a
                    where a.quiz = q and a.schoolClass.id = :classId
                ))
                or exists (
                    select s.id from QuizStudyClassAssignment s
                    where s.quiz = q
                      and s.studyClass.status = com.vn.aitutor.entity.enums.StudyClassStatus.ACTIVE
                      and exists (
                        select e.id from StudyClassEnrollment e
                        where e.studyClass = s.studyClass
                          and e.student.id = :studentId
                          and e.status = com.vn.aitutor.entity.enums.EnrollmentStatus.APPROVED
                      )
                )
              )
            order by q.createdAt desc
            """)
    List<Quiz> findPublishedForStudent(@Param("classId") UUID classId, @Param("studentId") UUID studentId);
}
