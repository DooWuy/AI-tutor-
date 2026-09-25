package com.vn.aitutor.dto.response.analytics;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AnalyticsFiltersResponse {
    private List<ClassOptionDto> classes;
    private List<SubjectOptionDto> subjects;
    private UUID defaultClassId;
    private String defaultPeriod;
}
