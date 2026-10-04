package com.vn.aitutor.repository.projection;

import java.math.BigDecimal;
import java.time.Instant;

public interface StudentLearningSummaryRow {
    Long getQuizAttemptCount();
    BigDecimal getAverageScore();
    Instant getLastQuizSubmittedAt();
}
