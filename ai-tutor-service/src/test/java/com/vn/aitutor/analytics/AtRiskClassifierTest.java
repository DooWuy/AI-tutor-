package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.entity.enums.RiskLevel;
import com.vn.aitutor.entity.enums.RiskReason;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class AtRiskClassifierTest {

    @Test
    void ac03_lowScoreAndEightInactiveDaysIsRedWithoutGaps() {
        AtRiskClassifier.RiskResult result =
                AtRiskClassifier.classify(new BigDecimal("4.5"), 8, 0);

        assertEquals(RiskLevel.RED, result.level());
        assertTrue(result.reasons().contains(RiskReason.LOW_SCORE));
        assertTrue(result.reasons().contains(RiskReason.INACTIVE));
    }

    @Test
    void singleSignalsAreOrange() {
        assertEquals(RiskLevel.ORANGE, AtRiskClassifier.classify(new BigDecimal("8.0"), 8, 0).level());
        assertEquals(RiskLevel.ORANGE, AtRiskClassifier.classify(new BigDecimal("8.0"), 2, 2).level());
        assertEquals(RiskLevel.ORANGE, AtRiskClassifier.classify(new BigDecimal("4.5"), 2, 0).level());
    }

    @Test
    void inactivityPlusTwoGapsIsRed() {
        AtRiskClassifier.RiskResult result = AtRiskClassifier.classify(new BigDecimal("8.0"), 8, 2);
        assertEquals(RiskLevel.RED, result.level());
        assertTrue(result.reasons().contains(RiskReason.INACTIVE));
        assertTrue(result.reasons().contains(RiskReason.KNOWLEDGE_GAPS));
    }

    @Test
    void steadyStudentIsNotListed() {
        AtRiskClassifier.RiskResult result = AtRiskClassifier.classify(new BigDecimal("6.0"), 2, 0);
        assertNull(result.level());
        assertTrue(result.reasons().isEmpty());
    }

    @Test
    void oneGapTopicDoesNotCount() {
        AtRiskClassifier.RiskResult result = AtRiskClassifier.classify(new BigDecimal("8.0"), 1, 1);
        assertNull(result.level());
    }

    @Test
    void neverOpenedTheAppCountsAsInactive() {
        assertEquals(RiskLevel.ORANGE, AtRiskClassifier.classify(new BigDecimal("8.0"), null, 0).level());
    }

    @Test
    void ac06_lowerThresholdsFlagStudentsWhoWerePreviouslyClear() {
        AlertThresholds tighter = new AlertThresholds(new BigDecimal("6.0"), 5, 2);

        assertNull(AtRiskClassifier.classify(new BigDecimal("5.5"), 2, 0).level());
        assertEquals(
                RiskLevel.ORANGE, AtRiskClassifier.classify(new BigDecimal("5.5"), 2, 0, tighter).level());

        assertNull(AtRiskClassifier.classify(new BigDecimal("8.0"), 6, 0).level());
        assertEquals(
                RiskLevel.ORANGE, AtRiskClassifier.classify(new BigDecimal("8.0"), 6, 0, tighter).level());

        assertEquals(RiskLevel.RED, AtRiskClassifier.classify(new BigDecimal("5.5"), 6, 0, tighter).level());
    }
}
