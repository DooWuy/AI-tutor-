package com.vn.aitutor.dto.response.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScoreTrendPoint {
    private LocalDate weekStart;
    private BigDecimal averageScore;
    private long attemptCount;
}
