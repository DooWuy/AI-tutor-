package com.vn.aitutor.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class QuestionBankDto {
    private UUID id;
    private String stem;
    private Integer difficulty;
    private List<String> choices;
    private String correctAnswer;
    private String explanation;
    private List<String> tags;
    private UUID skillId;
}

