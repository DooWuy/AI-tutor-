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
    
    @Query("SELECT t FROM Teacher t WHERE t.user.id = :userId")
    Optional<Teacher> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Teacher t WHERE t.teacherCode = :teacherCode")
    boolean existsByTeacherCode(@Param("teacherCode") String teacherCode);
}
