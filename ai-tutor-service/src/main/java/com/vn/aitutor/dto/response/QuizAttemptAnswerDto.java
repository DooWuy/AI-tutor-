package com.vn.aitutor.dto.response;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizAttemptAnswerDto {
    private UUID questionId;
    private String questionText;
    private com.vn.aitutor.entity.enums.QuestionType type;
    private List<Map<String, Object>> options;
    private String selectedOptionKey;
    private String correctOptionKey;
    private String explanation;
    private boolean isCorrect;
    private int orderIndex;
}
