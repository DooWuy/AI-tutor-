package com.vn.aitutor.dto.response.analytics;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KnowledgeGapItemDto {
    private int rank;
    private String topic;
    private String subject;
    private int affectedStudentCount;
    private BigDecimal affectedPercent;
    private long wrongAnswerCount;
    private long correctAnswerCount;
    private int askingStudentCount;
    private String advice;
}
