package com.vn.aitutor.dto.response.analytics;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AlertSettingsView {
    private UUID classId;
    private BigDecimal scoreThreshold;
    private int inactivityDays;
    private int maxGapTopics;
    private String messageTemplate;
    private boolean customized;
}
