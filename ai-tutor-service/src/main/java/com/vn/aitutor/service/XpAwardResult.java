package com.vn.aitutor.service;

import com.vn.aitutor.entity.enums.XpAwardStatus;

public record XpAwardResult(
        int xpEarned,
        XpAwardStatus status,
        int dailyXpEarned,
        int dailyXpCap,
        int totalXp,
        int currentLevel) {
}
