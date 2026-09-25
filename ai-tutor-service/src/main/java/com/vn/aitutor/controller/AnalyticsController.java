package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.analytics.AnalyticsFiltersResponse;
import com.vn.aitutor.dto.response.analytics.DashboardSummaryResponse;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IAnalyticsService;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_TEACHER','ROLE_ADMIN')")
public class AnalyticsController {

    private final IAnalyticsService analyticsService;

    @GetMapping("/filters")
    public ResponseEntity<ApiResponse<AnalyticsFiltersResponse>> getFilters(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.<AnalyticsFiltersResponse>builder()
                .success(true)
                .message("Thành công")
                .data(analyticsService.getFilters(principal))
                .build());
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID classId,
            @RequestParam(defaultValue = "ALL") String subject,
            @RequestParam(defaultValue = "LAST_7_DAYS") ReportPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.<DashboardSummaryResponse>builder()
                .success(true)
                .message("Thành công")
                .data(analyticsService.getSummary(principal, classId, subject, period, from, to))
                .build());
    }
}
