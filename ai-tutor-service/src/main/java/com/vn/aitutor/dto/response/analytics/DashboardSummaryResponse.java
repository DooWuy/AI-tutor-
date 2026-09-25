package com.vn.aitutor.dto.response.analytics;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardSummaryResponse {
    private AppliedFiltersDto filters;
    private KpiMetricsDto kpis;
    private List<ScoreTrendPoint> scoreTrend;
    private List<StudyTimePoint> studyTimeByWeekday;
}
