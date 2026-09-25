package com.vn.aitutor.dto.response.analytics;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KpiMetricsDto {
    private int studentCount;
    private long quizAttemptCount;
    private BigDecimal averageQuizScore;
    private BigDecimal averageStudyHoursPerWeek;
    private int atRiskStudentCount;
}
