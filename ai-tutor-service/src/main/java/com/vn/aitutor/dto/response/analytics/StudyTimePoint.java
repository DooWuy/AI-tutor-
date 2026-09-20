package com.vn.aitutor.dto.response.analytics;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyTimePoint {
    private int dayOfWeek;
    private String label;
    private BigDecimal averageHours;
}
