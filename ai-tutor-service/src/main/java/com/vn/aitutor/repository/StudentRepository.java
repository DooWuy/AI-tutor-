package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
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
}
