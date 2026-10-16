package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Explicit allowlist: no answers, identity, or account/parent information. */
public record StudentProgressResponse(
        Summary summary,
        List<DailyActivity> dailyActivity,
        List<SubjectStats> subjectStats,
        List<RecentQuiz> recentQuizzes) {
    public record Summary(int totalXp, int currentLevel, int xpInCurrentLevel, int xpPerLevel,
                          int xpToNextLevel, int currentStreak, int longestStreak,
                          Instant lastLearningActivityAt) { }
    public record DailyActivity(LocalDate date, long quizCount, long studyMinutes, long xpEarned) { }
    public record SubjectStats(String subject, long attemptCount, Double averageScore,
                               Double bestScore, long xpEarned) { }
    public record RecentQuiz(UUID attemptId, UUID quizId, String title, String subject,
                             Double score, int xpEarned, Integer durationSeconds, Instant submittedAt) { }
}
