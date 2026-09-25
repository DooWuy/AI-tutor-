package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.dto.response.analytics.AppliedFiltersDto;
import com.vn.aitutor.dto.response.analytics.ClassReportResponse;
import com.vn.aitutor.dto.response.analytics.DashboardSummaryResponse;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapItemDto;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapsResponse;
import com.vn.aitutor.dto.response.analytics.KpiMetricsDto;
import com.vn.aitutor.dto.response.analytics.ScoreTrendPoint;
import com.vn.aitutor.dto.response.analytics.StudyTimePoint;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.contentstream.operator.Operator;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.pdfparser.PDFStreamParser;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

class PdfReportWriterTest {

    @Test
    void pdfEmbedsVectorChartsAndVietnameseText() throws IOException {
        byte[] bytes = PdfReportWriter.write(sampleReport());
        assertTrue(bytes.length > 4);
        assertTrue(bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F');

        try (PDDocument document = Loader.loadPDF(bytes)) {
            String text = new PDFTextStripper().getText(document);
            assertTrue(text.contains("THPT AI Tutor"));
            assertTrue(text.contains("AI Tutor"));
            assertTrue(text.contains("Nguyễn Thị Giáo"));
            assertTrue(text.contains("Thể tích hình nón"));

            boolean vector = false;
            boolean image = false;
            boolean embeddedFont = false;
            for (PDPage page : document.getPages()) {
                if (page.getResources() != null) {
                    for (var name : page.getResources().getXObjectNames()) {
                        PDXObject xobject = page.getResources().getXObject(name);
                        if (xobject instanceof PDImageXObject) {
                            image = true;
                        }
                    }
                    for (var name : page.getResources().getFontNames()) {
                        var font = page.getResources().getFont(name);
                        if (font != null && font.isEmbedded()) {
                            embeddedFont = true;
                        }
                    }
                }
                PDFStreamParser parser = new PDFStreamParser(page);
                for (Object token : parser.parse()) {
                    if (token instanceof Operator operator) {
                        String op = operator.getName();
                        if ("l".equals(op) || "re".equals(op) || "c".equals(op)) {
                            vector = true;
                        }
                    }
                }
            }
            assertTrue(embeddedFont);
            assertTrue(vector);
            assertFalse(image);
        }
    }

    private static ClassReportResponse sampleReport() {
        List<StudyTimePoint> bars = new ArrayList<>();
        String[] labels = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};
        for (int i = 0; i < labels.length; i++) {
            bars.add(StudyTimePoint.builder()
                    .dayOfWeek(i + 1)
                    .label(labels[i])
                    .averageHours(new BigDecimal(i == 0 ? "1.5" : "0.4"))
                    .build());
        }
        return ClassReportResponse.builder()
                .schoolName("THPT AI Tutor")
                .reporterName("Nguyễn Thị Giáo")
                .className("12A1")
                .summary(DashboardSummaryResponse.builder()
                        .filters(AppliedFiltersDto.builder()
                                .classId(UUID.randomUUID())
                                .className("12A1")
                                .subject("TOAN")
                                .period("LAST_7_DAYS")
                                .from(Instant.parse("2026-09-15T17:00:00Z"))
                                .to(Instant.parse("2026-09-22T16:59:59Z"))
                                .build())
                        .kpis(KpiMetricsDto.builder()
                                .studentCount(40)
                                .quizAttemptCount(80)
                                .averageQuizScore(new BigDecimal("8.0"))
                                .averageStudyHoursPerWeek(new BigDecimal("1.0"))
                                .atRiskStudentCount(4)
                                .build())
                        .scoreTrend(List.of(
                                ScoreTrendPoint.builder()
                                        .weekStart(LocalDate.of(2026, 9, 14))
                                        .averageScore(null)
                                        .attemptCount(0)
                                        .build(),
                                ScoreTrendPoint.builder()
                                        .weekStart(LocalDate.of(2026, 9, 21))
                                        .averageScore(new BigDecimal("8.0"))
                                        .attemptCount(80)
                                        .build()))
                        .studyTimeByWeekday(bars)
                        .build())
                .knowledgeGaps(KnowledgeGapsResponse.builder()
                        .classSize(40)
                        .analyzedAt(Instant.parse("2026-09-22T02:00:00Z"))
                        .gaps(List.of(KnowledgeGapItemDto.builder()
                                .rank(1)
                                .topic("Thể tích hình nón")
                                .subject("TOAN")
                                .affectedStudentCount(30)
                                .affectedPercent(new BigDecimal("75.0"))
                                .wrongAnswerCount(60)
                                .correctAnswerCount(20)
                                .askingStudentCount(30)
                                .advice("Nên chữa bài mẫu hình nón trên lớp.")
                                .build()))
                        .build())
                .build();
    }
}
