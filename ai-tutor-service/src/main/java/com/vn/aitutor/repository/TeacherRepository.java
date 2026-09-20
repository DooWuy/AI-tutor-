package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, UUID> {

    boolean existsByTeacherCode(String teacherCode);

    @Query("SELECT t FROM Teacher t WHERE t.user.id = :userId")
    Optional<Teacher> findByUserId(@Param("userId") UUID userId);
}
