package com.vn.aitutor.repository;

import com.vn.aitutor.entity.XpTransaction;
import com.vn.aitutor.entity.enums.XpSourceType;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface XpTransactionRepository extends JpaRepository<XpTransaction, UUID> {

    boolean existsByStudentIdAndSourceTypeAndSourceId(
            UUID studentId,
            XpSourceType sourceType,
            UUID sourceId);

    @Query("""
            SELECT COALESCE(SUM(tx.amount), 0)
            FROM XpTransaction tx
            WHERE tx.student.id = :studentId
              AND tx.occurredAt >= :fromInclusive
              AND tx.occurredAt < :toExclusive
            """)
    long sumAmountForStudentBetween(
            @Param("studentId") UUID studentId,
            @Param("fromInclusive") Instant fromInclusive,
            @Param("toExclusive") Instant toExclusive);
}
