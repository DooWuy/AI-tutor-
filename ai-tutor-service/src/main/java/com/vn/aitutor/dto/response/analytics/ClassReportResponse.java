package com.vn.aitutor.dto.response.analytics;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClassReportResponse {
    private String schoolName;
    private String reporterName;
    private String className;
    private DashboardSummaryResponse summary;
    private KnowledgeGapsResponse knowledgeGaps;
}
