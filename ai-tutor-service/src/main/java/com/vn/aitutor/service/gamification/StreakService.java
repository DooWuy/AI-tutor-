package com.vn.aitutor.service.gamification;

import com.vn.aitutor.entity.Student;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StreakService {
    private final Clock learningClock;
    private final ZoneId academicZone;

    /** Caller must hold the Student write lock in the quiz submission transaction. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void recordCompletion(Student student, Instant activityAt) {
        Instant now = learningClock.instant();
        if (activityAt == null) throw new IllegalArgumentException("Activity timestamp is required");
        // A future event cannot extend a streak beyond server time.
        Instant event = activityAt.isAfter(now) ? now : activityAt;
        Instant previous = student.getLastActivityDate();
        if (previous != null && !previous.isAfter(now) && event.isBefore(previous)) return;

        LocalDate activityDate = event.atZone(academicZone).toLocalDate();
        int next = 1;
        if (previous != null && !previous.isAfter(now)) {
            LocalDate lastDate = previous.atZone(academicZone).toLocalDate();
            int current = Math.max(0, student.getCurrentStreak());
            if (lastDate.equals(activityDate)) next = Math.max(1, current);
            else if (lastDate.plusDays(1).equals(activityDate)) next = Math.addExact(current, 1);
        }
        student.setCurrentStreak(next);
        student.setLongestStreak(Math.max(student.getLongestStreak(), next));
        student.setLastActivityDate(event);
    }

    public int effectiveCurrentStreak(Student student) {
        return effectiveCurrentStreak(student, learningClock.instant());
    }

    public int effectiveCurrentStreak(Student student, Instant now) {
        Instant last = student.getLastActivityDate();
        if (last == null || last.isAfter(now)) return 0;
        LocalDate today = now.atZone(academicZone).toLocalDate();
        LocalDate lastDate = last.atZone(academicZone).toLocalDate();
        return lastDate.isBefore(today.minusDays(1)) ? 0 : Math.max(0, student.getCurrentStreak());
    }
}
