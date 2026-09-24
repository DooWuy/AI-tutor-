package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.analytics.AnalyticsFiltersResponse;
import com.vn.aitutor.dto.response.analytics.ClassReportResponse;
import com.vn.aitutor.dto.response.analytics.DashboardSummaryResponse;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapsResponse;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IAnalyticsService;
import com.vn.aitutor.service.impl.KnowledgeGapService;
import com.vn.aitutor.service.impl.ReportExportService;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    private static final MediaType XLSX = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final IAnalyticsService analyticsService;
    private final KnowledgeGapService knowledgeGapService;
    private final ReportExportService reportExportService;

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

    @GetMapping("/knowledge-gaps")
    public ResponseEntity<ApiResponse<KnowledgeGapsResponse>> getKnowledgeGaps(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID classId,
            @RequestParam(defaultValue = "ALL") String subject,
            @RequestParam(defaultValue = "LAST_7_DAYS") ReportPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.<KnowledgeGapsResponse>builder()
                .success(true)
                .message("Thành công")
                .data(knowledgeGapService.getGaps(principal, classId, subject, period, from, to))
                .build());
    }

    @GetMapping("/report")
    public ResponseEntity<ApiResponse<ClassReportResponse>> getReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID classId,
            @RequestParam(defaultValue = "ALL") String subject,
            @RequestParam(defaultValue = "LAST_7_DAYS") ReportPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        ClassReportResponse report =
                reportExportService.buildReport(principal, classId, subject, period, from, to);
        return ResponseEntity.ok(ApiResponse.<ClassReportResponse>builder()
                .success(true)
                .message("Thành công")
                .data(report)
                .build());
    }

    @GetMapping(value = "/report.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID classId,
            @RequestParam(defaultValue = "ALL") String subject,
            @RequestParam(defaultValue = "LAST_7_DAYS") ReportPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        ClassReportResponse report =
                reportExportService.buildReport(principal, classId, subject, period, from, to);
        byte[] body = reportExportService.toPdf(report);
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + reportExportService.pdfFilename(report.getClassName()) + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(body);
    }

    @GetMapping(value = "/export.xlsx")
    public ResponseEntity<byte[]> exportExcel(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID classId,
            @RequestParam(defaultValue = "ALL") String subject,
            @RequestParam(defaultValue = "LAST_7_DAYS") ReportPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        ReportExportService.ExportFile file =
                reportExportService.exportExcel(principal, classId, subject, period, from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.filename() + "\"")
                .contentType(XLSX)
                .body(file.body());
    }
}
