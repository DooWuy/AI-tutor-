package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, UUID> {

    @Query("SELECT t FROM Teacher t LEFT JOIN FETCH t.user WHERE t.user.id IN :ids")
    List<Teacher> findByUser_IdIn(@Param("ids") Collection<UUID> ids);

    boolean existsByTeacherCode(String teacherCode);

    @Query("SELECT t FROM Teacher t LEFT JOIN FETCH t.user WHERE t.user.id = :userId")
    Optional<Teacher> findByUserId(@Param("userId") UUID userId);
}
