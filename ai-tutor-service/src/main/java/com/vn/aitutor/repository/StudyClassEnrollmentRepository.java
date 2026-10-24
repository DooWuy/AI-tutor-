package com.vn.aitutor.repository;

import com.vn.aitutor.entity.StudyClassEnrollment;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudyClassEnrollmentRepository extends JpaRepository<StudyClassEnrollment, UUID> {

    long countByStudyClass_IdAndStatus(UUID classId, EnrollmentStatus status);

    Optional<StudyClassEnrollment> findByIdAndStudyClass_Id(UUID id, UUID classId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT e FROM StudyClassEnrollment e
            JOIN FETCH e.student s JOIN FETCH s.user
            WHERE e.id = :id AND e.studyClass.id = :classId
            """)
    Optional<StudyClassEnrollment> findByIdAndStudyClassIdForUpdate(
            @Param("id") UUID id, @Param("classId") UUID classId);

    Optional<StudyClassEnrollment> findByStudyClass_IdAndStudent_Id(UUID classId, UUID studentId);

    List<StudyClassEnrollment> findByStudyClass_IdAndStatusOrderByRequestedAtAsc(UUID classId, EnrollmentStatus status);

    @Query("""
            SELECT e FROM StudyClassEnrollment e
            JOIN FETCH e.studyClass c JOIN FETCH c.teacher t JOIN FETCH t.user
            WHERE e.student.id = :studentId
            ORDER BY e.requestedAt DESC
            """)
    List<StudyClassEnrollment> findStudentEnrollments(@Param("studentId") UUID studentId);

    @Query("""
            SELECT e FROM StudyClassEnrollment e
            JOIN FETCH e.studyClass c JOIN FETCH c.teacher t JOIN FETCH t.user
            WHERE e.student.id = :studentId AND c.id = :classId
            """)
    Optional<StudyClassEnrollment> findStudentEnrollment(
            @Param("studentId") UUID studentId, @Param("classId") UUID classId);
}
