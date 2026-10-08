package com.vn.aitutor.dto.request;

import java.io.Serializable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizGenerationMessage implements Serializable {
    private UUID quizId;
    private String subject;
    private String topic;
    private int difficulty;
    private int count;
    private String gradeLevel;
}
