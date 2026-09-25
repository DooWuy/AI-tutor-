package com.vn.aitutor.repository.projection;

import java.time.LocalDate;

public interface WeeklyScoreRow {
    LocalDate getWeekStart();

    Double getScoreSum();

    long getAttemptCount();
}
