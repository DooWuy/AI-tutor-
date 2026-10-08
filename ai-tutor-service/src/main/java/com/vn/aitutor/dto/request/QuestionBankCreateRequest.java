package com.vn.aitutor.dto.request;

import java.util.List;
import java.util.UUID;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.vn.aitutor.entity.enums.QuestionType;

@Data
public class QuestionBankCreateRequest {
    private String stem;
    private QuestionType type;
    private Integer difficulty;
    private List<String> choices;
    private String correctAnswer;
    private String explanation;
    private List<String> tags;
    @JsonIgnore
    private UUID skillId;
}

