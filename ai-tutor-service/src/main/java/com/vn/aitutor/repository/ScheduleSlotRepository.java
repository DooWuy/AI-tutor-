package com.vn.aitutor.repository;

import com.vn.aitutor.entity.ScheduleSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, UUID> {
    List<ScheduleSlot> findByScheduleId(UUID scheduleId);
    
    void deleteByScheduleId(UUID scheduleId);

    // Thuật toán phát hiện trùng lịch (AC-04)
    @Query("SELECT s FROM ScheduleSlot s WHERE s.schedule.id = :scheduleId " +
           "AND s.dayOfWeek = :dayOfWeek " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    List<ScheduleSlot> findOverlappingSlots(
            @Param("scheduleId") UUID scheduleId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
}
