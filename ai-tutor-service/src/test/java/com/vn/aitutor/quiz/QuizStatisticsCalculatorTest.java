package com.vn.aitutor.quiz;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class QuizStatisticsCalculatorTest {

    @Test
    void passingRateIsSeventyWhenSevenOfTenStudentsReachTheThreshold() {
        List<Double> bestScores = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            bestScores.add(7.0);
        }
        for (int i = 0; i < 3; i++) {
            bestScores.add(6.9);
        }

        BigDecimal rate = QuizStatisticsCalculator.passingRate(bestScores, new BigDecimal("70.0"));

        assertEquals(new BigDecimal("70.0"), rate);
        assertTrue(QuizStatisticsCalculator.passes(7.0, new BigDecimal("70.0")));
        assertFalse(QuizStatisticsCalculator.passes(6.9, new BigDecimal("70.0")));
    }

    @Test
    void emptyCohortReportsZero() {
        assertEquals(new BigDecimal("0.0"), QuizStatisticsCalculator.passingRate(List.of(), new BigDecimal("70.0")));
    }
}
