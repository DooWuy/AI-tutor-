package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentPublishedQuizResponse {
    private UUID id;
    private String title;
    private String subject;
    private int questionCount;
    private int timeLimitMinutes;
    private Instant availableFrom;
    private Instant availableUntil;
    private String phase;
    private String classNames;
    private String teacherName;
    private UUID attemptId;
    private Double score;
    private Instant submittedAt;
    private boolean canStart;
    private boolean canReview;
}
