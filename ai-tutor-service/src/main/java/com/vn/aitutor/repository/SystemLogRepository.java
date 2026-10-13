package com.vn.aitutor.repository;

import com.vn.aitutor.entity.SystemLog;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SystemLogRepository extends JpaRepository<SystemLog, UUID> {

    @Query("""
            SELECT l FROM SystemLog l
            WHERE (:level IS NULL OR :level = '' OR l.level = :level)
              AND (:keyword IS NULL OR :keyword = '' OR LOWER(l.message) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(l.source) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:fromDate IS NULL OR l.createdAt >= :fromDate)
              AND (:toDate IS NULL OR l.createdAt <= :toDate)
            """)
    Page<SystemLog> searchLogs(
            @Param("level") String level,
            @Param("keyword") String keyword,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            Pageable pageable
    );

    @Modifying
    @Query("DELETE FROM SystemLog l WHERE l.createdAt < :cutoff")
    int purgeLogsOlderThan(@Param("cutoff") Instant cutoff);
}
