package com.vn.aitutor.dto.request;

import java.util.UUID;
import lombok.Data;

@Data
public class AIGenerateQuestionRequest {
    private UUID skillId;
    private Integer difficulty;
    private Integer count;
}

