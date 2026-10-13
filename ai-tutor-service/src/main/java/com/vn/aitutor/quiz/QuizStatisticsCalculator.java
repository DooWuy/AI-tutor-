package com.vn.aitutor.quiz;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public final class QuizStatisticsCalculator {

    private QuizStatisticsCalculator() {
    }

    public static boolean passes(double scoreOnTen, BigDecimal passingPercent) {
        if (passingPercent == null) {
            return false;
        }
        return BigDecimal.valueOf(scoreOnTen).multiply(BigDecimal.TEN).compareTo(passingPercent) >= 0;
    }

    public static BigDecimal passingRate(List<Double> bestScores, BigDecimal passingPercent) {
        if (bestScores == null || bestScores.isEmpty()) {
            return new BigDecimal("0.0");
        }
        long passed = bestScores.stream().filter(score -> passes(score, passingPercent)).count();
        return BigDecimal.valueOf(passed)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(bestScores.size()), 1, RoundingMode.HALF_UP);
    }
}
