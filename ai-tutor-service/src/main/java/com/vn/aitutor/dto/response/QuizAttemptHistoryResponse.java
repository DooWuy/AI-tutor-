package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizAttemptHistoryResponse {
    private UUID id;
    private UUID quizId;
    private String quizTitle;
    private boolean isAiGenerated;
    private Double score;
    private int xpEarned;
    private Integer durationSeconds;
    private Instant submittedAt;
}
