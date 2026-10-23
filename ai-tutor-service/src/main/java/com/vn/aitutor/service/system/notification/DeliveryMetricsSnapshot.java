package com.vn.aitutor.service.system.notification;

public record DeliveryMetricsSnapshot(long pending, long failed, double oldestPendingSeconds) {}
