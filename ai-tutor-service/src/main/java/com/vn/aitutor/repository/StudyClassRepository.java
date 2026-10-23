package com.vn.aitutor.repository;

import com.vn.aitutor.entity.StudyClass;
import com.vn.aitutor.entity.enums.StudyClassStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudyClassRepository extends JpaRepository<StudyClass, UUID> {

    long countByTeacher_IdAndStatus(UUID teacherId, StudyClassStatus status);

    boolean existsByClassCode(String classCode);

    Optional<StudyClass> findByClassCode(String classCode);

    List<StudyClass> findByTeacher_IdOrderByCreatedAtDesc(UUID teacherId);

    List<StudyClass> findByTeacher_IdAndStatusOrderByNameAsc(UUID teacherId, StudyClassStatus status);

    List<StudyClass> findAllByOrderByNameAsc();

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            UPDATE StudyClass c
               SET c.status = com.vn.aitutor.entity.enums.StudyClassStatus.DISSOLVED,
                   c.updatedAt = :now
             WHERE c.status = com.vn.aitutor.entity.enums.StudyClassStatus.ACTIVE
               AND c.endDate IS NOT NULL
               AND c.endDate < :today
            """)
    int dissolveExpired(@Param("today") LocalDate today, @Param("now") Instant now);
}
