package com.vn.aitutor.service;

import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.enums.LeaderboardScope;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.StudentClassRequiredException;
import com.vn.aitutor.repository.LeaderboardRepository;
import com.vn.aitutor.repository.projection.LeaderboardRow;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LeaderboardServiceTest {
    final QuizAccessService access = mock(QuizAccessService.class);
    final LeaderboardRepository repository = mock(LeaderboardRepository.class);
    final Instant now = Instant.parse("2026-10-15T10:00:00Z");
    final LeaderboardService service = new LeaderboardService(access, repository,
            new QuizGradingService(200), Clock.fixed(now, ZoneOffset.UTC));

    @Test void globalTopAndMeOutsideTopUseSameConfiguredLevel() {
        Student student = new Student(); student.setId(UUID.randomUUID());
        when(access.currentStudent()).thenReturn(student);
        when(repository.findRanking(student.getId(), null, 1)).thenReturn(List.of(
                new LeaderboardRow(1, "First", null, 800, false),
                new LeaderboardRow(24, "Me", null, 250, true)));
        var result = service.getLeaderboard(LeaderboardScope.GLOBAL, 1);
        assertEquals(now, result.generatedAt()); assertEquals(1, result.entries().size());
        assertEquals(5, result.entries().get(0).currentLevel());
        assertEquals(24, result.me().rank()); assertEquals(2, result.me().currentLevel());
    }

    @Test void classScopeUsesActualRelationAndKeepsMeWhenAlreadyInTop() {
        Student student = new Student(); student.setId(UUID.randomUUID());
        SchoolClass schoolClass = new SchoolClass(); schoolClass.setId(UUID.randomUUID()); student.setClassEntity(schoolClass);
        when(access.currentStudent()).thenReturn(student);
        when(repository.findRanking(student.getId(), schoolClass.getId(), 20))
                .thenReturn(List.of(new LeaderboardRow(1, "Me", null, 0, true)));
        var result = service.getLeaderboard(LeaderboardScope.CLASS, 20);
        assertEquals(result.entries().get(0), result.me()); assertEquals(1, result.me().currentLevel());
        verify(repository).findRanking(student.getId(), schoolClass.getId(), 20);
    }

    @Test void classNameTextDoesNotGrantClassMembership() {
        Student student = new Student(); student.setClassName("10A1");
        when(access.currentStudent()).thenReturn(student);
        assertThrows(StudentClassRequiredException.class, () -> service.getLeaderboard(LeaderboardScope.CLASS, 20));
        verifyNoInteractions(repository);
    }

    @Test void rejectsUnboundedLimitsBeforeQuerying() {
        for (int limit : new int[] {0, -1, 51, Integer.MAX_VALUE}) {
            assertThrows(ResourceBadRequestException.class, () -> service.getLeaderboard(LeaderboardScope.GLOBAL, limit));
        }
        assertThrows(ResourceBadRequestException.class, () -> service.getLeaderboard(null, 20));
        verifyNoInteractions(repository, access);
    }
}
