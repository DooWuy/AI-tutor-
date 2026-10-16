package com.vn.aitutor.service;

import com.vn.aitutor.config.StreakResetJob;
import com.vn.aitutor.entity.Student;
import java.time.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StreakServiceTest {
    // 00:30 on Oct 15 in Vietnam; UTC is still Oct 14.
    final Instant now = Instant.parse("2026-10-14T17:30:00Z");
    final Clock clock = Clock.fixed(now, ZoneOffset.UTC);
    final ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
    final StreakService service = new StreakService(clock, zone);

    @Test void firstCompletionAndSameDayOnlyCountOnce() {
        Student student = new Student();
        service.recordCompletion(student, now.minusSeconds(600));
        service.recordCompletion(student, now);
        assertEquals(1, student.getCurrentStreak());
        assertEquals(1, student.getLongestStreak());
        assertEquals(now, student.getLastActivityDate());
    }

    @Test void crossingLocalMidnightExtendsStreakDespiteSameUtcDate() {
        Student student = state(3, 7, "2026-10-14T16:59:00Z");
        service.recordCompletion(student, now);
        assertEquals(4, student.getCurrentStreak());
        assertEquals(7, student.getLongestStreak());
    }

    @Test void missedDayRestartsAndKeepsLongest() {
        Student student = state(5, 8, "2026-10-13T16:59:00Z");
        assertEquals(0, service.effectiveCurrentStreak(student));
        service.recordCompletion(student, now);
        assertEquals(1, student.getCurrentStreak());
        assertEquals(8, student.getLongestStreak());
    }

    @Test void yesterdayRemainsActiveUntilAnEntireDayIsMissed() {
        Student student = state(3, 3, "2026-10-13T17:00:00Z");
        assertEquals(3, service.effectiveCurrentStreak(student));
        student.setLastActivityDate(Instant.parse("2026-10-13T16:59:59Z"));
        assertEquals(0, service.effectiveCurrentStreak(student));
        assertEquals(3, student.getCurrentStreak(), "Reads must not write the entity");
    }

    @Test void olderCompletionDoesNotMoveLatestActivityBackwards() {
        Student student = state(3, 3, now.toString());
        service.recordCompletion(student, now.minusSeconds(86400));
        assertEquals(now, student.getLastActivityDate());
        assertEquals(3, student.getCurrentStreak());
    }

    @Test void futureAndMissingHistoricalStateDoNotDisplayPhantomStreak() {
        Student student = state(10, 10, now.plusSeconds(86400).toString());
        assertEquals(0, service.effectiveCurrentStreak(student));
        service.recordCompletion(student, now.plusSeconds(60));
        assertEquals(now, student.getLastActivityDate());
        assertEquals(1, student.getCurrentStreak());
        assertEquals(10, student.getLongestStreak());
        student.setLastActivityDate(null);
        assertEquals(0, service.effectiveCurrentStreak(student));
        assertThrows(IllegalArgumentException.class, () -> service.recordCompletion(student, null));
    }

    @Test void longestGrowsAndNegativeHistoricalCurrentIsNotPropagated() {
        Student student = state(3, 3, "2026-10-14T16:00:00Z");
        service.recordCompletion(student, now);
        assertEquals(4, student.getLongestStreak());
        student = state(-1, 4, "2026-10-14T16:00:00Z");
        service.recordCompletion(student, now);
        assertEquals(1, student.getCurrentStreak());
    }

    @Test void schedulerUsesLocalCutoffAndBoundsEachRun() {
        StreakResetService resets = mock(StreakResetService.class);
        Instant cutoff = Instant.parse("2026-10-13T17:00:00Z");
        when(resets.resetBatch(cutoff)).thenReturn(200, 1, 0);
        StreakResetJob job = new StreakResetJob(resets, clock, zone);
        job.resetExpiredStreaks();
        verify(resets, times(2)).resetBatch(cutoff);
        reset(resets);
        when(resets.resetBatch(cutoff)).thenReturn(200);
        job.resetExpiredStreaks();
        verify(resets, times(20)).resetBatch(cutoff);
    }

    Student state(int current, int longest, String last) {
        Student student = new Student(); student.setCurrentStreak(current);
        student.setLongestStreak(longest); student.setLastActivityDate(Instant.parse(last));
        return student;
    }
}
