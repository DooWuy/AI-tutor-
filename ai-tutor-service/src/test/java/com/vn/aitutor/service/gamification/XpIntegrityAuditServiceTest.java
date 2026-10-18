package com.vn.aitutor.service.gamification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.entity.AuditLog;
import com.vn.aitutor.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class XpIntegrityAuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private XpIntegrityAuditService auditService;

    @Test
    void record_savesAuditLogWithViolationAction() {
        auditService.record("XP balance calculation mismatch");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).saveAndFlush(captor.capture());

        AuditLog saved = captor.getValue();
        assertNotNull(saved);
        assertEquals("XP_LEDGER_INTEGRITY_VIOLATION", saved.getAction());
        assertEquals("reason=XP balance calculation mismatch", saved.getDetails());
    }
}
