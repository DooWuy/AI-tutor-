package com.vn.aitutor.dto.response.analytics;

import com.vn.aitutor.entity.enums.RiskLevel;
import com.vn.aitutor.entity.enums.RiskReason;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AtRiskStudentDto {
    private UUID studentId;
    private String studentCode;
    private String fullName;
    private BigDecimal averageScore;
    private Integer inactiveDays;
    private int gapTopicCount;
    private List<String> gapTopics;
    private List<String> subjects;
    private RiskLevel level;
    private List<RiskReason> reasons;
}
