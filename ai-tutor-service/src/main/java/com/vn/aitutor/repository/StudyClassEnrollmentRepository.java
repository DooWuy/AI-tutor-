package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.StudyClassEnrollment;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudyClassEnrollmentRepository extends JpaRepository<StudyClassEnrollment, UUID> {

    long countByStudyClass_IdAndStatus(UUID classId, EnrollmentStatus status);

    Optional<StudyClassEnrollment> findByIdAndStudyClass_Id(UUID id, UUID classId);

    Optional<StudyClassEnrollment> findByStudyClass_IdAndStudent_Id(UUID classId, UUID studentId);

    List<StudyClassEnrollment> findByStudyClass_IdAndStatusOrderByRequestedAtAsc(UUID classId, EnrollmentStatus status);

    @Query("""
            select e from StudyClassEnrollment e
            join fetch e.studyClass c
            join fetch c.teacher t
            join fetch t.user
            where e.student.id = :studentId
            order by e.requestedAt desc
            """)
    List<StudyClassEnrollment> findMine(@Param("studentId") UUID studentId);

    @Query("""
            select e from StudyClassEnrollment e
            join fetch e.student s
            join fetch s.user
            where e.studyClass.id = :classId
              and e.status = com.vn.aitutor.entity.enums.EnrollmentStatus.APPROVED
            """)
    List<StudyClassEnrollment> findApprovedWithUser(@Param("classId") UUID classId);

    @Query(
            value = """
                    SELECT COUNT(*) FROM study_class_enrollments e
                    JOIN students s ON s.id = e.student_id
                    JOIN users u ON u.id = s.user_id
                    WHERE e.class_id = :classId
                      AND e.status = 'APPROVED'
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                    """,
            nativeQuery = true)
    long countApprovedActive(@Param("classId") UUID classId);

    @Query(
            value = """
                    SELECT s.* FROM students s
                    JOIN users u ON u.id = s.user_id
                    JOIN study_class_enrollments e ON e.student_id = s.id
                    WHERE e.class_id = :classId
                      AND e.status = 'APPROVED'
                      AND u.role = 'STUDENT'
                      AND u.is_deleted = FALSE
                      AND (CAST(:search AS text) IS NULL OR LOWER(u.full_name) LIKE LOWER('%' || CAST(:search AS text) || '%')
                           OR LOWER(u.email) LIKE LOWER('%' || CAST(:search AS text) || '%')
                           OR LOWER(u.username) LIKE LOWER('%' || CAST(:search AS text) || '%')
                           OR LOWER(s.student_code) LIKE LOWER('%' || CAST(:search AS text) || '%'))
                    """,
            countQuery = """
                    SELECT COUNT(*) FROM students s
                    JOIN users u ON u.id = s.user_id
                    JOIN study_class_enrollments e ON e.student_id = s.id
                    WHERE e.class_id = :classId
                      AND e.status = 'APPROVED'
                      AND u.role = 'STUDENT'
                      AND u.is_deleted = FALSE
                      AND (CAST(:search AS text) IS NULL OR LOWER(u.full_name) LIKE LOWER('%' || CAST(:search AS text) || '%')
                           OR LOWER(u.email) LIKE LOWER('%' || CAST(:search AS text) || '%')
                           OR LOWER(u.username) LIKE LOWER('%' || CAST(:search AS text) || '%')
                           OR LOWER(s.student_code) LIKE LOWER('%' || CAST(:search AS text) || '%'))
                    """,
            nativeQuery = true)
    Page<Student> searchApproved(@Param("classId") UUID classId, @Param("search") String search, Pageable pageable);
}
