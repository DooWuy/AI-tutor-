package com.vn.aitutor.analytics;

import java.math.BigDecimal;

public record AlertThresholds(BigDecimal scoreThreshold, int inactivityDays, int maxGapTopics) {

    public static AlertThresholds defaults() {
        return new AlertThresholds(
                KpiCalculator.DEFAULT_SCORE_THRESHOLD, KpiCalculator.DEFAULT_INACTIVITY_DAYS, AtRiskClassifier.GAP_TOPIC_THRESHOLD);
    }
}
