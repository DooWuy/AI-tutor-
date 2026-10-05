package com.vn.aitutor.service;

import com.vn.aitutor.dto.response.analytics.ClassReportResponse;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.time.LocalDate;
import java.util.UUID;

public interface IReportExportService {

    record ExportFile(String filename, byte[] body) {}

    ClassReportResponse buildReport(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to);

    byte[] toPdf(ClassReportResponse report);

    ExportFile exportExcel(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to);

    String pdfFilename(String className);
}
