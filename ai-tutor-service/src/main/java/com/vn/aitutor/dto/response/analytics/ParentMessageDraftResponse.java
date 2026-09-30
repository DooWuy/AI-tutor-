package com.vn.aitutor.dto.response.analytics;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ParentMessageDraftResponse {
    private UUID studentId;
    private String fullName;
    private Integer inactiveDays;
    private BigDecimal averageScore;
    private List<String> gapTopics;
    private List<String> subjects;
    private String body;
    private int minLength;
    private int maxLength;
}
