package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.AlertSettingsRequest;
import com.vn.aitutor.dto.request.ParentMessageSendRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.analytics.AlertSettingsUpdateResponse;
import com.vn.aitutor.dto.response.analytics.AlertSettingsView;
import com.vn.aitutor.dto.response.analytics.AnalyticsFiltersResponse;
import com.vn.aitutor.dto.response.analytics.AtRiskListResponse;
import com.vn.aitutor.dto.response.analytics.ClassReportResponse;
import com.vn.aitutor.dto.response.analytics.DashboardSummaryResponse;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapsResponse;
import com.vn.aitutor.dto.response.analytics.ParentMessageDraftResponse;
import com.vn.aitutor.dto.response.analytics.ParentMessageSendResponse;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IAnalyticsService;
import com.vn.aitutor.service.impl.AlertSettingsService;
import com.vn.aitutor.service.impl.AtRiskService;
import com.vn.aitutor.service.impl.KnowledgeGapService;
import com.vn.aitutor.service.impl.ParentMessageService;
import com.vn.aitutor.service.impl.ReportExportService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final AtRiskService atRiskService;
    private final ParentMessageService parentMessageService;
    private final AlertSettingsService alertSettingsService;

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

    @GetMapping("/at-risk")
    public ResponseEntity<ApiResponse<AtRiskListResponse>> getAtRisk(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam UUID classId,
            @RequestParam(defaultValue = "ALL") String subject,
            @RequestParam(defaultValue = "LAST_7_DAYS") ReportPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.<AtRiskListResponse>builder()
                .success(true)
                .message("Thành công")
                .data(atRiskService.list(principal, classId, subject, period, from, to))
                .build());
    }

    @GetMapping("/students/{studentId}/parent-message-draft")
    public ResponseEntity<ApiResponse<ParentMessageDraftResponse>> draftParentMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID studentId,
            @RequestParam UUID classId,
            @RequestParam(defaultValue = "ALL") String subject,
            @RequestParam(defaultValue = "LAST_7_DAYS") ReportPeriod period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.<ParentMessageDraftResponse>builder()
                .success(true)
                .message("Thành công")
                .data(parentMessageService.draft(principal, studentId, classId, subject, period, from, to))
                .build());
    }

    @PostMapping("/students/{studentId}/parent-messages")
    public ResponseEntity<ApiResponse<ParentMessageSendResponse>> sendParentMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID studentId,
            @Valid @RequestBody ParentMessageSendRequest request) {
        return ResponseEntity.ok(ApiResponse.<ParentMessageSendResponse>builder()
                .success(true)
                .message("Thành công")
                .data(parentMessageService.send(principal, studentId, request))
                .build());
    }

    @GetMapping("/classes/{classId}/alert-settings")
    public ResponseEntity<ApiResponse<AlertSettingsView>> getAlertSettings(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID classId) {
        return ResponseEntity.ok(ApiResponse.<AlertSettingsView>builder()
                .success(true)
                .message("Thành công")
                .data(alertSettingsService.get(principal, classId))
                .build());
    }

    @PutMapping("/classes/{classId}/alert-settings")
    public ResponseEntity<ApiResponse<AlertSettingsUpdateResponse>> updateAlertSettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID classId,
            @Valid @RequestBody AlertSettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.<AlertSettingsUpdateResponse>builder()
                .success(true)
                .message("Đã lưu cấu hình và quét lại danh sách cảnh báo")
                .data(alertSettingsService.update(principal, classId, request))
                .build());
    }
}
