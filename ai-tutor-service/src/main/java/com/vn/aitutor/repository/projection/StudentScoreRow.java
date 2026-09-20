package com.vn.aitutor.repository.projection;

import java.time.Instant;
import java.util.UUID;

public interface StudentScoreRow {
    UUID getStudentId();

    Double getScoreSum();

    long getAttemptCount();

    Instant getLastActivityDate();
}
