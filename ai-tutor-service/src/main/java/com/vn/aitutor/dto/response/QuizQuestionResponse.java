package com.vn.aitutor.dto.response;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuizQuestionResponse {
    private UUID id;
    private String stem;
    private String explanation;
    private int difficulty;
    private String questionType;
    private List<String> tags;
    private List<Map<String, Object>> options;
    private String correctOptionKey;
    private String correctText;
    private int orderIndex;
    private UUID sourceQuestionId;
}
