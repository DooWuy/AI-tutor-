package com.vn.aitutor.service.quiz;

import com.vn.aitutor.dto.response.quiz.StudentProgressResponse;
import com.vn.aitutor.service.gamification.StreakService;
import com.vn.aitutor.dto.response.quiz.StudentProgressResponse.DailyActivity;
import com.vn.aitutor.dto.response.quiz.StudentProgressResponse.Summary;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.repository.StudentProgressRepository;
import com.vn.aitutor.repository.StudentProgressRepository.DailyQuiz;
import com.vn.aitutor.repository.StudentProgressRepository.DailyXp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentProgressService {
    private final QuizAccessService access;
    private final StudentProgressRepository progress;
    private final QuizGradingService grading;
    private final StreakService streaks;
    private final Clock learningClock;
    private final ZoneId academicZone;

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public StudentProgressResponse getMyProgress() {
        Student student = access.currentStudent();
        Instant now = learningClock.instant();
        LocalDate today = now.atZone(academicZone).toLocalDate();
        LocalDate first = today.minusDays(6);
        Instant from = first.atStartOfDay(academicZone).toInstant();
        Instant to = today.plusDays(1).atStartOfDay(academicZone).toInstant();
        Map<LocalDate, DailyQuiz> quizzes = progress.dailyQuizzes(student.getId(), from, to, academicZone.getId())
                .stream().collect(Collectors.toMap(DailyQuiz::date, Function.identity()));
        Map<LocalDate, DailyXp> xp = progress.dailyXp(student.getId(), from, to, academicZone.getId())
                .stream().collect(Collectors.toMap(DailyXp::date, Function.identity()));
        var days = first.datesUntil(today.plusDays(1)).map(day -> {
            DailyQuiz quiz = quizzes.get(day);
            DailyXp award = xp.get(day);
            return new DailyActivity(day, quiz == null ? 0 : quiz.count(),
                    quiz == null ? 0 : quiz.seconds() / 60, award == null ? 0 : award.amount());
        }).toList();
        int total = student.getTotalXp();
        int perLevel = grading.xpPerLevel();
        Summary summary = new Summary(total, grading.level(total), total % perLevel, perLevel,
                perLevel - total % perLevel, streaks.effectiveCurrentStreak(student, now),
                student.getLongestStreak(), student.getLastActivityDate());
        return new StudentProgressResponse(summary, days, progress.subjects(student.getId()),
                progress.recentQuizzes(student.getId()));
    }
}
