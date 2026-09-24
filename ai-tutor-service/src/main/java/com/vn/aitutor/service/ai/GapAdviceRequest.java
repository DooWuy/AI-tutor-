package com.vn.aitutor.service.ai;

import java.math.BigDecimal;
import java.util.List;

public record GapAdviceRequest(
        String topic,
        String subject,
        BigDecimal affectedPercent,
        int affectedStudentCount,
        int classSize,
        long wrongAnswerCount,
        int askingStudentCount,
        List<String> excerpts) {}
