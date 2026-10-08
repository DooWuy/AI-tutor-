package com.vn.aitutor.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuizResponse {
    private UUID id;
    private String title;
    private String description;
    private String subject;
    private String gradeLevel;
    private UUID lessonId;
    private String lessonTitle;
    private int timeLimitMinutes;
    private int maxAttempts;
    private BigDecimal passingScore;
    private String status;
    private boolean aiGenerated;
    private int questionCount;
    private long attemptCount;
    private String createdByName;
    private Instant createdAt;
    private List<QuizQuestionResponse> questions;
}
