package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TeacherClassQuizResponse {
    private UUID id;
    private String title;
    private String subject;
    private String gradeLevel;
    private int questionCount;
    private long attemptCount;
    private int timeLimitMinutes;
}
