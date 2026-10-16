package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.AuditLog;
import com.vn.aitutor.entity.QuizAttempt;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.XpTransaction;
import com.vn.aitutor.entity.enums.XpAwardStatus;
import com.vn.aitutor.repository.AuditLogRepository;
import com.vn.aitutor.repository.XpTransactionRepository;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class XpAwardServiceTest {

    @Mock private XpTransactionRepository transactions;
    @Mock private com.vn.aitutor.repository.QuizAttemptRepository attempts;
    @Mock private ISystemSettingsService settings;
    @Mock private AuditLogRepository auditLogs;
    @Mock private XpIntegrityAuditService integrityAudit;

    private XpAwardService awards;
    private Student student;
    private QuizAttempt attempt;
    private UUID quizId;

    @BeforeEach
    void setUp() {
        awards = new XpAwardService(
                transactions,
                attempts,
                settings,
                new QuizGradingService(100),
                auditLogs,
                integrityAudit,
                "Asia/Ho_Chi_Minh");
        student = new Student();
        student.setId(UUID.randomUUID());
        student.setTotalXp(90);
        student.setCurrentLevel(1);
        attempt = new QuizAttempt();
        attempt.setId(UUID.randomUUID());
        quizId = UUID.randomUUID();
        org.mockito.Mockito.lenient()
                .when(settings.getSetting(XpAwardService.DAILY_CAP_KEY, "500"))
                .thenReturn("500");
    }

    @Test
    void awardsXpAndRecordsImmutableLedgerData() {
        when(transactions.sumAmountForStudentBetween(any(), any(), any())).thenReturn(100L);

        XpAwardResult result = award(40, false);

        assertEquals(40, result.xpEarned());
        assertEquals(XpAwardStatus.AWARDED, result.status());
        assertEquals(140, result.dailyXpEarned());
        assertEquals(130, result.totalXp());
        assertEquals(2, result.currentLevel());
        assertEquals(XpAwardStatus.AWARDED, attempt.getXpAwardStatus());

        ArgumentCaptor<XpTransaction> transaction = ArgumentCaptor.forClass(XpTransaction.class);
        verify(transactions).saveAndFlush(transaction.capture());
        assertEquals(quizId, transaction.getValue().getSourceId());
        assertEquals(attempt, transaction.getValue().getReferenceAttempt());
        assertEquals(40, transaction.getValue().getAmount());
        assertEquals(130, transaction.getValue().getBalanceAfter());
    }

    @Test
    void partiallyCapsAwardAtRemainingDailyAllowance() {
        when(transactions.sumAmountForStudentBetween(any(), any(), any())).thenReturn(490L);

        XpAwardResult result = award(40, false);

        assertEquals(10, result.xpEarned());
        assertEquals(500, result.dailyXpEarned());
        assertEquals(XpAwardStatus.PARTIALLY_CAPPED, result.status());
        assertEquals(100, student.getTotalXp());
        assertEquals(2, student.getCurrentLevel());
    }

    @Test
    void reportsDailyCapRetakeAndZeroScoreWithoutLedgerWrites() {
        when(transactions.sumAmountForStudentBetween(any(), any(), any())).thenReturn(500L);
        assertEquals(XpAwardStatus.DAILY_CAP_REACHED, award(40, false).status());

        when(transactions.sumAmountForStudentBetween(any(), any(), any())).thenReturn(20L);
        assertEquals(XpAwardStatus.ALREADY_REWARDED, award(40, true).status());
        assertEquals(XpAwardStatus.NO_XP_EARNED, award(0, false).status());

        verify(transactions, never()).saveAndFlush(any());
        assertEquals(90, student.getTotalXp());
    }

    @Test
    void calculatesDayBoundariesInConfiguredAcademicTimezone() {
        when(transactions.sumAmountForStudentBetween(any(), any(), any())).thenReturn(0L);
        Instant occurredAt = Instant.parse("2026-10-13T17:30:00Z");

        awards.awardQuizCompletion(student, quizId, attempt, 10, false, occurredAt);

        ArgumentCaptor<Instant> from = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> to = ArgumentCaptor.forClass(Instant.class);
        verify(transactions).sumAmountForStudentBetween(
                org.mockito.ArgumentMatchers.eq(student.getId()), from.capture(), to.capture());
        assertEquals(Instant.parse("2026-10-13T17:00:00Z"), from.getValue());
        assertEquals(Instant.parse("2026-10-14T17:00:00Z"), to.getValue());
    }

    @Test
    void invalidDailyCapFallsBackAndCreatesNonPiiAudit() {
        when(settings.getSetting(XpAwardService.DAILY_CAP_KEY, "500")).thenReturn("invalid");
        when(transactions.sumAmountForStudentBetween(any(), any(), any())).thenReturn(0L);

        XpAwardResult result = award(10, false);

        assertEquals(500, result.dailyXpCap());
        ArgumentCaptor<AuditLog> audit = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogs).save(audit.capture());
        assertEquals("XP_INVALID_SETTING", audit.getValue().getAction());
        assertEquals("key=gamification.daily_xp_cap; fallback=500", audit.getValue().getDetails());
    }

    @Test
    void rejectsNegativeXpStateAndAuditsWithoutStudentIdentity() {
        student.setTotalXp(-1);

        assertThrows(com.vn.aitutor.exception.ResourceConflictException.class,
                () -> award(10, false));

        verify(integrityAudit).record("negative-xp-state");
    }

    private XpAwardResult award(int rawXp, boolean previouslyCompleted) {
        return awards.awardQuizCompletion(
                student,
                quizId,
                attempt,
                rawXp,
                previouslyCompleted,
                Instant.parse("2026-10-14T02:00:00Z"));
    }

    @Test
    void exactCapStillReportsFullAwardAndNextQuizIsCapped() {
        when(transactions.sumAmountForStudentBetween(any(), any(), any())).thenReturn(460L);
        assertEquals(XpAwardStatus.AWARDED, award(40, false).status());
        when(transactions.sumAmountForStudentBetween(any(), any(), any())).thenReturn(500L);
        assertEquals(XpAwardStatus.DAILY_CAP_REACHED, award(10, false).status());
        assertEquals(130, student.getTotalXp());
    }

    @Test
    void duplicateSourceIsRejectedAndAudited() {
        when(transactions.existsByStudentIdAndSourceTypeAndSourceId(any(), any(), any())).thenReturn(true);
        assertThrows(com.vn.aitutor.exception.ResourceConflictException.class, () -> award(10, false));
        verify(integrityAudit).record("duplicate-quiz-award-source");
        verify(transactions, never()).saveAndFlush(any());
        assertEquals(90, student.getTotalXp());
    }
}
