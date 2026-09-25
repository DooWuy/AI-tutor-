package com.vn.aitutor.dto.response.analytics;

import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KnowledgeGapsResponse {
    private AppliedFiltersDto filters;
    private int classSize;
    private Instant analyzedAt;
    private List<KnowledgeGapItemDto> gaps;
}
