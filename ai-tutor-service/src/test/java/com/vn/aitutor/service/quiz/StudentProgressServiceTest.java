package com.vn.aitutor.service.quiz;

import com.vn.aitutor.entity.Student;
import com.vn.aitutor.service.gamification.StreakService;
import com.vn.aitutor.repository.StudentProgressRepository;
import com.vn.aitutor.repository.StudentProgressRepository.DailyQuiz;
import com.vn.aitutor.repository.StudentProgressRepository.DailyXp;
import java.time.*;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StudentProgressServiceTest {
    @Test void fillsSevenLocalDaysAndUsesConfiguredLevelAndLedger() {
        QuizAccessService access = mock(QuizAccessService.class);
        StudentProgressRepository repository = mock(StudentProgressRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-10-14T17:30:00Z"), ZoneOffset.UTC);
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        Student student = new Student(); student.setId(UUID.randomUUID()); student.setTotalXp(250);
        student.setCurrentLevel(99); student.setCurrentStreak(9); student.setLongestStreak(12);
        student.setLastActivityDate(Instant.parse("2026-10-12T16:59:00Z"));
        when(access.currentStudent()).thenReturn(student);
        Instant from = Instant.parse("2026-10-08T17:00:00Z");
        Instant to = Instant.parse("2026-10-15T17:00:00Z");
        when(repository.dailyQuizzes(student.getId(), from, to, zone.getId()))
                .thenReturn(List.of(new DailyQuiz(LocalDate.parse("2026-10-15"), 2, 119)));
        when(repository.dailyXp(student.getId(), from, to, zone.getId()))
                .thenReturn(List.of(new DailyXp(LocalDate.parse("2026-10-15"), 10)));
        var response = new StudentProgressService(access, repository, new QuizGradingService(200),
                new StreakService(clock, zone), clock, zone).getMyProgress();
        assertEquals(2, response.summary().currentLevel());
        assertEquals(50, response.summary().xpInCurrentLevel());
        assertEquals(150, response.summary().xpToNextLevel());
        assertEquals(200, response.summary().xpPerLevel());
        assertEquals(0, response.summary().currentStreak());
        assertEquals(12, response.summary().longestStreak());
        assertEquals(7, response.dailyActivity().size());
        assertEquals(LocalDate.parse("2026-10-09"), response.dailyActivity().get(0).date());
        assertEquals(0, response.dailyActivity().get(0).quizCount());
        assertEquals(0, response.dailyActivity().get(0).xpEarned());
        assertEquals(2, response.dailyActivity().get(6).quizCount());
        assertEquals(1, response.dailyActivity().get(6).studyMinutes());
        assertEquals(10, response.dailyActivity().get(6).xpEarned());
    }

    @Test void levelBoundaryUsesZeroProgressAndFullNextLevelDistance() {
        QuizAccessService access = mock(QuizAccessService.class);
        StudentProgressRepository repository = mock(StudentProgressRepository.class);
        Student student = new Student(); student.setId(UUID.randomUUID()); student.setTotalXp(200);
        when(access.currentStudent()).thenReturn(student);
        Clock clock = Clock.fixed(Instant.EPOCH, ZoneOffset.UTC);
        var response = new StudentProgressService(access, repository, new QuizGradingService(100),
                new StreakService(clock, ZoneOffset.UTC), clock, ZoneOffset.UTC).getMyProgress();
        assertEquals(3, response.summary().currentLevel());
        assertEquals(0, response.summary().xpInCurrentLevel());
        assertEquals(100, response.summary().xpToNextLevel());
        assertEquals(7, response.dailyActivity().size());
        assertNull(response.summary().lastLearningActivityAt());
    }
}
