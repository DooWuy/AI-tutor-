package com.vn.aitutor.service;

import com.vn.aitutor.dto.response.analytics.AnalyticsFiltersResponse;
import com.vn.aitutor.dto.response.analytics.DashboardSummaryResponse;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.time.LocalDate;
import java.util.UUID;

public interface IAnalyticsService {

    AnalyticsFiltersResponse getFilters(UserPrincipal principal);

    DashboardSummaryResponse getSummary(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to);
}
