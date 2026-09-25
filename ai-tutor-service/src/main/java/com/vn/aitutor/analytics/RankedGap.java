package com.vn.aitutor.analytics;

import java.math.BigDecimal;

public record RankedGap(
        String topic,
        String subject,
        int affectedStudentCount,
        BigDecimal affectedPercent,
        long wrongAnswerCount,
        long correctAnswerCount) {}
