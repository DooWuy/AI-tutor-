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

    java.util.List<Teacher> findByUser_IdIn(java.util.Collection<UUID> ids);

    boolean existsByTeacherCode(String teacherCode);

    @Query("SELECT t FROM Teacher t LEFT JOIN FETCH t.user WHERE t.user.id = :userId")
    Optional<Teacher> findByUserId(@Param("userId") UUID userId);
}
