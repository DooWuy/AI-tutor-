package com.vn.aitutor.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuestionResponse {
    private UUID id;
    private UUID lessonId;
    private String skillCode;
    private String skillName;
    private String stem;
    private String explanation;
    private int difficulty;
    private String questionType;
    private String reviewStatus;
    private List<String> tags;
    private List<ChoiceResponse> choices;
    private String correctText;
    private UUID batchId;
}
