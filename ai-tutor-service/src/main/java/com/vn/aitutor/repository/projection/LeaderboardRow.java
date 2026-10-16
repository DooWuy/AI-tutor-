package com.vn.aitutor.repository.projection;

public record LeaderboardRow(long rank, String displayName, String avatarUrl, int totalXp, boolean me) { }
