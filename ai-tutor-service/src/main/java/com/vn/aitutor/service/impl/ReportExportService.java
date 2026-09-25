package com.vn.aitutor.service.impl;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.analytics.ExcelScoreWorkbook;
import com.vn.aitutor.analytics.PdfReportWriter;
import com.vn.aitutor.analytics.ReportFileNames;
import com.vn.aitutor.dto.response.analytics.ClassReportResponse;
import com.vn.aitutor.dto.response.analytics.DashboardSummaryResponse;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapsResponse;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.projection.RawScoreRow;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.AnalyticsAccess;
import com.vn.aitutor.service.IAnalyticsService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportExportService {

    private final AnalyticsAccess analyticsAccess;
    private final IAnalyticsService analyticsService;
    private final KnowledgeGapService knowledgeGapService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AcademicCalendar academicCalendar;

    public ClassReportResponse buildReport(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, classId);
        DashboardSummaryResponse summary = analyticsService.getSummary(principal, classId, subject, period, from, to);
        KnowledgeGapsResponse gaps = knowledgeGapService.getGaps(principal, classId, subject, period, from, to);
        String schoolName = schoolClass.getSchoolName();
        if (schoolName == null || schoolName.isBlank()) {
            schoolName = "AI Tutor";
        }
        String reporter = principal.getUsers() == null ? "Giáo viên" : principal.getUsers().getFullName();
        return ClassReportResponse.builder()
                .schoolName(schoolName)
                .reporterName(reporter)
                .className(schoolClass.getName())
                .summary(summary)
                .knowledgeGaps(gaps)
                .build();
    }

    public byte[] toPdf(ClassReportResponse report) {
        return PdfReportWriter.write(report);
    }

    public ExportFile exportExcel(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, classId);
        ReportPeriod resolved = period == null ? ReportPeriod.LAST_7_DAYS : period;
        String subjectFilter = SubjectCode.normalizeFilter(subject);
        AcademicCalendar.DateRange range = academicCalendar.resolve(resolved, from, to, Instant.now());
        List<RawScoreRow> rows =
                quizAttemptRepository.findRawScores(classId, range.from(), range.to(), subjectFilter);
        return new ExportFile(ReportFileNames.excel(schoolClass.getName()), ExcelScoreWorkbook.write(rows));
    }

    public record ExportFile(String filename, byte[] body) {}

    public String pdfFilename(String className) {
        return ReportFileNames.pdf(className);
    }
}
