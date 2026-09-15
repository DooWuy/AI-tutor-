package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    @Query("SELECT s FROM Student s WHERE s.studentCode = :studentCode")
    Optional<Student> findByStudentCode(@Param("studentCode") String studentCode);
}
