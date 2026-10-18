package com.vn.aitutor.service.gamification;

import com.vn.aitutor.entity.AuditLog;
import com.vn.aitutor.entity.QuizAttempt;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.XpTransaction;
import com.vn.aitutor.entity.enums.XpAwardStatus;
import com.vn.aitutor.entity.enums.XpSourceType;
import com.vn.aitutor.exception.ResourceConflictException;
import org.springframework.dao.DataIntegrityViolationException;
import com.vn.aitutor.repository.AuditLogRepository;
import com.vn.aitutor.repository.XpTransactionRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.vn.aitutor.service.system.ISystemSettingsService;
import com.vn.aitutor.service.quiz.QuizGradingService;

@Slf4j
@Service
public class XpAwardService {
    static final String DAILY_CAP_KEY = "gamification.daily_xp_cap";
    static final int DEFAULT_DAILY_CAP = 500;
    static final int MAX_DAILY_CAP = 1_000_000;

    private final XpTransactionRepository transactions;
    private final QuizAttemptRepository attempts;
    private final ISystemSettingsService settings;
    private final QuizGradingService grading;
    private final XpIntegrityAuditService integrityAudit;
    private final AuditLogRepository auditLogs;
    private final ZoneId academicZone;

    public XpAwardService(
            XpTransactionRepository transactions,
            QuizAttemptRepository attempts,
            ISystemSettingsService settings,
            QuizGradingService grading,
            AuditLogRepository auditLogs,
            XpIntegrityAuditService integrityAudit,
            @Value("${app.academic.timezone:Asia/Ho_Chi_Minh}") String academicTimezone) {
        this.transactions = transactions;
        this.attempts = attempts;
        this.settings = settings;
        this.grading = grading;
        this.auditLogs = auditLogs;
        this.integrityAudit = integrityAudit;
        this.academicZone = ZoneId.of(academicTimezone);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public XpAwardResult awardQuizCompletion(
            Student student,
            UUID quizId,
            QuizAttempt attempt,
            int rawXp,
            boolean previouslyCompleted,
            Instant occurredAt) {
        if (rawXp < 0 || student.getTotalXp() < 0) {
            auditIntegrityViolation("negative-xp-state");
            throw new ResourceConflictException("Trạng thái XP không hợp lệ");
        }

        int dailyCap = dailyCap();
        ZonedDateTime localTime = occurredAt.atZone(academicZone);
        Instant fromInclusive = localTime.toLocalDate().atStartOfDay(academicZone).toInstant();
        Instant toExclusive = localTime.toLocalDate().plusDays(1).atStartOfDay(academicZone).toInstant();
        int earnedBefore = Math.toIntExact(transactions.sumAmountForStudentBetween(
                student.getId(), fromInclusive, toExclusive));

        XpAwardStatus status;
        int awarded;
        if (previouslyCompleted) {
            status = XpAwardStatus.ALREADY_REWARDED;
            awarded = 0;
        } else if (rawXp == 0) {
            status = XpAwardStatus.NO_XP_EARNED;
            awarded = 0;
        } else if (earnedBefore >= dailyCap) {
            status = XpAwardStatus.DAILY_CAP_REACHED;
            awarded = 0;
        } else {
            awarded = Math.min(rawXp, dailyCap - earnedBefore);
            status = awarded == rawXp ? XpAwardStatus.AWARDED : XpAwardStatus.PARTIALLY_CAPPED;
        }

        int dailyEarned = Math.addExact(earnedBefore, awarded);
        attempt.setXpEarned(awarded);
        attempt.setXpAwardStatus(status);
        attempt.setDailyXpEarned(dailyEarned);
        attempt.setDailyXpCap(dailyCap);
        // Finish all award queries and snapshot fields before persisting the immutable
        // attempt. Hibernate may auto-flush pending inserts before an aggregate query.
        attempts.save(attempt);
        if (awarded > 0) {
            if (transactions.existsByStudentIdAndSourceTypeAndSourceId(
                    student.getId(), XpSourceType.QUIZ_FIRST_COMPLETION, quizId)) {
                auditIntegrityViolation("duplicate-quiz-award-source");
                throw new ResourceConflictException("Nguồn thưởng XP đã được ghi nhận");
            }

            int balanceAfter = Math.addExact(student.getTotalXp(), awarded);
            XpTransaction transaction = new XpTransaction();
            transaction.setStudent(student);
            transaction.setSourceType(XpSourceType.QUIZ_FIRST_COMPLETION);
            transaction.setSourceId(quizId);
            transaction.setReferenceAttempt(attempt);
            transaction.setAmount(awarded);
            transaction.setBalanceAfter(balanceAfter);
            transaction.setOccurredAt(occurredAt);
            transaction.setMetadata(Map.of("awardStatus", status.name()));
            try {
                transactions.saveAndFlush(transaction);
            } catch (DataIntegrityViolationException exception) {
                auditIntegrityViolation("ledger-database-constraint");
                throw exception;
            }

            student.setTotalXp(balanceAfter);
            student.setCurrentLevel(grading.level(balanceAfter));
        }

        return new XpAwardResult(
                awarded,
                status,
                dailyEarned,
                dailyCap,
                student.getTotalXp(),
                student.getCurrentLevel());
    }

    private int dailyCap() {
        String configured = settings.getSetting(DAILY_CAP_KEY, Integer.toString(DEFAULT_DAILY_CAP));
        try {
            int value = Integer.parseInt(configured.trim());
            if (value >= 1 && value <= MAX_DAILY_CAP) return value;
        } catch (RuntimeException ignored) {
            // The fallback and audit below keep quiz submission available without trusting invalid configuration.
        }
        auditLogs.save(AuditLog.builder()
                .action("XP_INVALID_SETTING")
                .details("key=" + DAILY_CAP_KEY + "; fallback=" + DEFAULT_DAILY_CAP)
                .build());
        log.warn("Invalid {} value; using fallback {}", DAILY_CAP_KEY, DEFAULT_DAILY_CAP);
        return DEFAULT_DAILY_CAP;
    }

    private void auditIntegrityViolation(String reason) {
        integrityAudit.record(reason);
    }
}
