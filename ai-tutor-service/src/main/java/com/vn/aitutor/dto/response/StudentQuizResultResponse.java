package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentQuizResultResponse {
    private UUID studentId;
    private String studentCode;
    private String fullName;
    private String className;
    private double bestScore;
    private int attemptCount;
    private boolean passed;
    private Instant lastSubmittedAt;
}
