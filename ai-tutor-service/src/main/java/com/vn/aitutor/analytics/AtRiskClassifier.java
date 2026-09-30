package com.vn.aitutor.analytics;

import com.vn.aitutor.entity.enums.RiskLevel;
import com.vn.aitutor.entity.enums.RiskReason;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Red / orange classification. Score and inactivity use the same thresholds as the KPI card.
 * Two or more signals are red. Low score together with inactivity is red even with no gaps.
 */
public final class AtRiskClassifier {

    public static final int GAP_TOPIC_THRESHOLD = 2;

    private AtRiskClassifier() {}

    public record RiskResult(RiskLevel level, List<RiskReason> reasons) {}

    public static RiskResult classify(BigDecimal averageScore, Integer inactiveDays, int gapTopicCount) {
        return classify(averageScore, inactiveDays, gapTopicCount, AlertThresholds.defaults());
    }

    public static RiskResult classify(
            BigDecimal averageScore, Integer inactiveDays, int gapTopicCount, AlertThresholds thresholds) {
        AlertThresholds rules = thresholds == null ? AlertThresholds.defaults() : thresholds;
        List<RiskReason> reasons = new ArrayList<>();
        if (averageScore != null && averageScore.compareTo(rules.scoreThreshold()) < 0) {
            reasons.add(RiskReason.LOW_SCORE);
        }
        if (inactiveDays == null || inactiveDays > rules.inactivityDays()) {
            reasons.add(RiskReason.INACTIVE);
        }
        if (gapTopicCount >= rules.maxGapTopics()) {
            reasons.add(RiskReason.KNOWLEDGE_GAPS);
        }
        if (reasons.size() >= 2) {
            return new RiskResult(RiskLevel.RED, List.copyOf(reasons));
        }
        if (reasons.size() == 1) {
            return new RiskResult(RiskLevel.ORANGE, List.copyOf(reasons));
        }
        return new RiskResult(null, List.of());
    }
}
