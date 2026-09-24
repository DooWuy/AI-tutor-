package com.vn.aitutor.repository.projection;

import java.time.Instant;

public interface RawScoreRow {
    String getStudentCode();

    String getFullName();

    String getClassName();

    String getSubject();

    String getQuizTitle();

    Double getScore();

    Integer getDurationSeconds();

    Instant getSubmittedAt();
}
