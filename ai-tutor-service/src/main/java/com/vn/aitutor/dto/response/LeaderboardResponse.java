package com.vn.aitutor.dto.response;

import com.vn.aitutor.entity.enums.LeaderboardScope;
import java.time.Instant;
import java.util.List;

/** Public display allowlist; account/student identifiers and private profile fields are excluded. */
public record LeaderboardResponse(LeaderboardScope scope, Instant generatedAt, List<Entry> entries, Entry me) {
    public record Entry(long rank, String displayName, String avatarUrl, int totalXp, int currentLevel) { }
}
