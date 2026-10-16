package com.vn.aitutor.service;

import com.vn.aitutor.entity.AuditLog;
import com.vn.aitutor.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** A rejected award must remain auditable after the submission transaction rolls back. */
@Slf4j
@Service
@RequiredArgsConstructor
public class XpIntegrityAuditService {
    private final AuditLogRepository auditLogs;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String reason) {
        log.error("XP_LEDGER_INTEGRITY_VIOLATION reason={}", reason);
        auditLogs.saveAndFlush(AuditLog.builder()
                .action("XP_LEDGER_INTEGRITY_VIOLATION")
                .details("reason=" + reason)
                .build());
    }
}
