package com.vn.aitutor.repository;

import com.vn.aitutor.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, UUID> {
    List<Schedule> findByStudentId(UUID studentId);
    Optional<Schedule> findByStudentIdAndIsActiveTrue(UUID studentId);

    @Query("SELECT s FROM Schedule s WHERE s.student.user.id = :userId AND s.isActive = true")
    Optional<Schedule> findActiveScheduleByUserId(@Param("userId") UUID userId);
}
