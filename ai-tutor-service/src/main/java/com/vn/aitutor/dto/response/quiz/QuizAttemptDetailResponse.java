package com.vn.aitutor.dto.response.quiz;

import com.vn.aitutor.entity.enums.XpAwardStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizAttemptDetailResponse {
    private UUID id;
    private UUID quizId;
    private String quizTitle;
    private boolean isAiGenerated;
    private Double score;
    private int xpEarned;
    private XpAwardStatus xpAwardStatus;
    private Integer dailyXpEarned;
    private Integer dailyXpCap;
    private int correctCount;
    private int totalQuestions;
    private int totalXp;
    private int currentLevel;
    private Integer durationSeconds;
    private Instant submittedAt;
    private List<QuizAttemptAnswerDto> answers;
}
