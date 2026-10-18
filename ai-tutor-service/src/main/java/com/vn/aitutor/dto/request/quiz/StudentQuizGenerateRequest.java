package com.vn.aitutor.dto.request.quiz;

import lombok.Data;

@Data
public class StudentQuizGenerateRequest {
    private String subjectId;
    private String topic;
    private int difficulty;
    private int count;
}

