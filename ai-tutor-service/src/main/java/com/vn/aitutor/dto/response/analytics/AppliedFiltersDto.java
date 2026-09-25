package com.vn.aitutor.dto.response.analytics;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AppliedFiltersDto {
    private UUID classId;
    private String className;
    private String subject;
    private String period;
    private Instant from;
    private Instant to;
}
