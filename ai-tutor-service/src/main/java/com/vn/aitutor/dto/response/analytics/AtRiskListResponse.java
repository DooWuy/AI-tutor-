package com.vn.aitutor.dto.response.analytics;

import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AtRiskListResponse {
    private AppliedFiltersDto filters;
    private Instant evaluatedAt;
    private List<AtRiskStudentDto> students;
}
