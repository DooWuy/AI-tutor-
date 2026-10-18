package com.vn.aitutor.service.gamification;

import com.vn.aitutor.dto.response.gamification.LeaderboardResponse;
import com.vn.aitutor.dto.response.gamification.LeaderboardResponse.Entry;
import com.vn.aitutor.service.quiz.QuizAccessService;
import com.vn.aitutor.service.quiz.QuizGradingService;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.enums.LeaderboardScope;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.StudentClassRequiredException;
import com.vn.aitutor.repository.LeaderboardRepository;
import com.vn.aitutor.repository.projection.LeaderboardRow;
import java.time.Clock;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LeaderboardService {
    private final QuizAccessService access;
    private final LeaderboardRepository leaderboard;
    private final QuizGradingService grading;
    private final Clock learningClock;

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public LeaderboardResponse getLeaderboard(LeaderboardScope scope, int limit) {
        if (scope == null || limit < 1 || limit > 50) {
            throw new ResourceBadRequestException("scope phải là GLOBAL/CLASS; limit phải trong khoảng 1–50");
        }
        Student student = access.currentStudent();
        UUID classId = null;
        if (scope == LeaderboardScope.CLASS) {
            if (student.getClassEntity() == null) throw new StudentClassRequiredException();
            classId = student.getClassEntity().getId();
        }
        var rows = leaderboard.findRanking(student.getId(), classId, limit);
        Entry me = rows.stream().filter(LeaderboardRow::me).findFirst().map(this::entry)
                .orElseThrow(() -> new ResourceForbiddenException("Học sinh hiện tại không thuộc bảng xếp hạng hợp lệ"));
        return new LeaderboardResponse(scope, learningClock.instant(),
                rows.stream().filter(row -> row.rank() <= limit).map(this::entry).toList(), me);
    }

    private Entry entry(LeaderboardRow row) {
        return new Entry(row.rank(), row.displayName(), row.avatarUrl(), row.totalXp(), grading.level(row.totalXp()));
    }
}
