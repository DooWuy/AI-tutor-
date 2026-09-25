package com.vn.aitutor.analytics;

import java.util.UUID;

public record StudentTopicCount(
        String topic, String subject, UUID studentId, long wrongCount, long correctCount) {}
