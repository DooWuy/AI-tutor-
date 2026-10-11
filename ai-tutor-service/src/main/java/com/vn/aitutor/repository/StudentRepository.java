package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Student s WHERE s.id = :id")
    Optional<Student> lockById(@Param("id") UUID id);
    @Query(value = """
            SELECT s.* FROM students s
            JOIN users u ON u.id = s.user_id
            LEFT JOIN school_classes c ON c.id = s.class_id
            WHERE u.role = 'STUDENT' AND u.is_deleted = FALSE
              AND (CAST(:active AS boolean) IS NULL OR u.is_active = CAST(:active AS boolean))
              AND (CAST(:gradeLevel AS text) IS NULL OR LOWER(s.grade_level) = LOWER(CAST(:gradeLevel AS text)))
              AND (CAST(:schoolName AS text) IS NULL OR LOWER(s.school_name) LIKE LOWER('%' || CAST(:schoolName AS text) || '%'))
              AND (CAST(:classId AS uuid) IS NULL OR c.id = CAST(:classId AS uuid))
              AND (CAST(:search AS text) IS NULL OR LOWER(u.full_name) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(u.email) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(u.username) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(s.student_code) LIKE LOWER('%' || CAST(:search AS text) || '%'))
            """,
            countQuery = """
            SELECT COUNT(*) FROM students s JOIN users u ON u.id = s.user_id LEFT JOIN school_classes c ON c.id = s.class_id
            WHERE u.role = 'STUDENT' AND u.is_deleted = FALSE
              AND (CAST(:active AS boolean) IS NULL OR u.is_active = CAST(:active AS boolean))
              AND (CAST(:gradeLevel AS text) IS NULL OR LOWER(s.grade_level) = LOWER(CAST(:gradeLevel AS text)))
              AND (CAST(:schoolName AS text) IS NULL OR LOWER(s.school_name) LIKE LOWER('%' || CAST(:schoolName AS text) || '%'))
              AND (CAST(:classId AS uuid) IS NULL OR c.id = CAST(:classId AS uuid))
              AND (CAST(:search AS text) IS NULL OR LOWER(u.full_name) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(u.email) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(u.username) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(s.student_code) LIKE LOWER('%' || CAST(:search AS text) || '%'))
            """, nativeQuery = true)
    Page<Student> searchAdminStudents(@Param("search") String search,
                                      @Param("active") Boolean active,
                                      @Param("gradeLevel") String gradeLevel,
                                      @Param("schoolName") String schoolName,
                                      @Param("classId") UUID classId,
                                      Pageable pageable);

    @Query(value = """
            SELECT s.* FROM students s
            JOIN users u ON u.id = s.user_id
            WHERE u.role = 'STUDENT' AND u.is_deleted = FALSE
              AND s.class_id IN (:classIds)
              AND (CAST(:search AS text) IS NULL OR LOWER(u.full_name) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(u.email) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(u.username) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(s.student_code) LIKE LOWER('%' || CAST(:search AS text) || '%'))
            """,
            countQuery = """
            SELECT COUNT(*) FROM students s JOIN users u ON u.id = s.user_id
            WHERE u.role = 'STUDENT' AND u.is_deleted = FALSE
              AND s.class_id IN (:classIds)
              AND (CAST(:search AS text) IS NULL OR LOWER(u.full_name) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(u.email) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(u.username) LIKE LOWER('%' || CAST(:search AS text) || '%')
                   OR LOWER(s.student_code) LIKE LOWER('%' || CAST(:search AS text) || '%'))
            """, nativeQuery = true)
    Page<Student> searchTeacherStudents(@Param("classIds") Collection<UUID> classIds,
                                        @Param("search") String search,
                                        Pageable pageable);

    @Query("SELECT s FROM Student s JOIN FETCH s.user u LEFT JOIN FETCH s.classEntity c WHERE s.id = :id AND u.role = com.vn.aitutor.entity.enums.Role.STUDENT AND u.isDeleted = false")
    Optional<Student> findActiveStudentWithUserById(@Param("id") UUID id);

    @Query("SELECT s FROM Student s WHERE s.studentCode = :studentCode")
    Optional<Student> findByStudentCode(@Param("studentCode") String studentCode);

    @Query("SELECT s FROM Student s WHERE s.user.id = :userId")
    Optional<Student> findByUserId(@Param("userId") UUID userId);

    boolean existsByStudentCode(String studentCode);

    @Query(
            value = """
                    SELECT COUNT(*) FROM students s
                    JOIN users u ON u.id = s.user_id
                    WHERE s.class_id = :classId
                      AND u.is_deleted = FALSE
                      AND u.is_active = TRUE
                    """,
            nativeQuery = true)
    long countActiveByClassId(@Param("classId") UUID classId);

    List<Student> findByClassEntity_IdOrderByStudentCodeAsc(UUID classId);

    @Query("SELECT s FROM Student s JOIN FETCH s.user WHERE s.classEntity.id = :classId")
    List<Student> findWithUserByClassId(@Param("classId") UUID classId);

    @Query("SELECT s FROM Student s JOIN FETCH s.user LEFT JOIN FETCH s.classEntity WHERE s.id = :id")
    Optional<Student> findWithUserById(@Param("id") UUID id);
}
