package com.vn.aitutor.dto.response.dashboard;

import java.time.Instant;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description="All-time system counts in one database snapshot; no date filter")
public record AdminDashboardResponse(long totalUsers, long totalDocuments, long totalQuizzes,
        long chatCount, long attemptCount, Instant updatedAt) {}
