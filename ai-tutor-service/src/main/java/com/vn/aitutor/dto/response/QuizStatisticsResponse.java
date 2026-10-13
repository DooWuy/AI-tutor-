package com.vn.aitutor.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuizStatisticsResponse {
    private UUID quizId;
    private String title;
    private BigDecimal passingScore;
    private long attemptCount;
    private BigDecimal averageScore;
    private BigDecimal passingRate;
    private List<HardQuestionResponse> hardestQuestions;
    private List<StudentQuizResultResponse> students;
}
