package com.vn.aitutor.dto.response;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HardQuestionResponse {
    private UUID questionId;
    private String stem;
    private long wrongCount;
    private long answerCount;
    private BigDecimal wrongRate;
}
