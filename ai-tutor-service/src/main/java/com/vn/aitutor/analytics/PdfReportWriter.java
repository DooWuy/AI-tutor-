package com.vn.aitutor.analytics;

import com.vn.aitutor.dto.response.analytics.ClassReportResponse;
import com.vn.aitutor.dto.response.analytics.DashboardSummaryResponse;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapItemDto;
import com.vn.aitutor.dto.response.analytics.KpiMetricsDto;
import com.vn.aitutor.dto.response.analytics.ScoreTrendPoint;
import com.vn.aitutor.dto.response.analytics.StudyTimePoint;
import com.vn.aitutor.entity.enums.SubjectCode;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;

public final class PdfReportWriter {

    private static final DateTimeFormatter DAY =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final float LINE = 13f;
    private static final String REGULAR = "/fonts/NotoSans-Regular.ttf";
    private static final String BOLD = "/fonts/NotoSans-Bold.ttf";

    private PdfReportWriter() {}

    public static byte[] write(ClassReportResponse report) {
        try {
            return writeChecked(report);
        } catch (IOException ex) {
            throw new UncheckedIOException("Không tạo được file PDF", ex);
        }
    }

    private static byte[] writeChecked(ClassReportResponse report) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDFont regular = loadFont(document, REGULAR);
            PDFont bold = loadFont(document, BOLD);
            Canvas canvas = new Canvas(document, regular, bold, schoolName(report), reporterName(report));
            canvas.openPage();
            canvas.drawWordmark();
            canvas.text(canvas.school, bold, 16);
            canvas.text("Giáo viên báo cáo: " + canvas.teacher, regular, 11);
            canvas.text(metaLine(report), regular, 11);
            canvas.gap(6);
            canvas.text("Báo cáo phân tích học tập", bold, 14);
            canvas.gap(4);
            canvas.drawKpis(report.getSummary() == null ? null : report.getSummary().getKpis());
            canvas.gap(8);
            canvas.drawScoreChart(report.getSummary());
            canvas.gap(10);
            canvas.drawStudyChart(report.getSummary());
            canvas.gap(10);
            canvas.drawGaps(report.getKnowledgeGaps() == null ? List.of() : report.getKnowledgeGaps().getGaps());
            canvas.close();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }

    private static PDFont loadFont(PDDocument document, String path) throws IOException {
        try (InputStream in = PdfReportWriter.class.getResourceAsStream(path)) {
            if (in == null) {
                throw new IOException("Thiếu font " + path);
            }
            return PDType0Font.load(document, in, true);
        }
    }

    private static String schoolName(ClassReportResponse report) {
        if (report == null || report.getSchoolName() == null || report.getSchoolName().isBlank()) {
            return "AI Tutor";
        }
        return report.getSchoolName();
    }

    private static String reporterName(ClassReportResponse report) {
        if (report == null || report.getReporterName() == null || report.getReporterName().isBlank()) {
            return "Giáo viên";
        }
        return report.getReporterName();
    }

    private static String metaLine(ClassReportResponse report) {
        String className = report == null || report.getClassName() == null ? "" : report.getClassName();
        String subject = "Tất cả môn học";
        String period = "";
        if (report != null && report.getSummary() != null && report.getSummary().getFilters() != null) {
            var filters = report.getSummary().getFilters();
            subject = subjectLabel(filters.getSubject());
            period = filters.getPeriod() == null ? "" : filters.getPeriod();
            if (filters.getFrom() != null && filters.getTo() != null) {
                period = period + " (" + DAY.format(filters.getFrom()) + " - " + DAY.format(filters.getTo()) + ")";
            }
        }
        return "Lớp " + className + " | Môn " + subject + " | Kỳ " + period;
    }

    private static String subjectLabel(String code) {
        if (code == null || SubjectCode.isAll(code)) {
            return "Tất cả môn học";
        }
        try {
            return SubjectCode.valueOf(code).getDisplayName();
        } catch (IllegalArgumentException ex) {
            return code;
        }
    }

    private static final class Canvas {
        private final PDDocument document;
        private final PDFont regular;
        private final PDFont bold;
        private final String school;
        private final String teacher;
        private PDPageContentStream stream;
        private float y;

        private Canvas(PDDocument document, PDFont regular, PDFont bold, String school, String teacher) {
            this.document = document;
            this.regular = regular;
            this.bold = bold;
            this.school = school;
            this.teacher = teacher;
        }

        private void openPage() throws IOException {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = PdfLayout.PAGE_HEIGHT - PdfLayout.MARGIN;
        }

        private void close() throws IOException {
            if (stream != null) {
                stream.close();
                stream = null;
            }
        }

        private void newPage() throws IOException {
            close();
            openPage();
            drawWordmark();
            text(school, bold, 12);
            text("Giáo viên báo cáo: " + teacher, regular, 10);
            gap(6);
        }

        private void ensure(float height) throws IOException {
            if (y - height < PdfLayout.MARGIN) {
                newPage();
            }
        }

        private void gap(float amount) {
            y -= amount;
        }

        private void drawWordmark() throws IOException {
            float cy = y - 12;
            stream.setStrokingColor(new Color(20, 90, 160));
            stream.setLineWidth(1.4f);
            circle(PdfLayout.MARGIN + 12, cy, 9);
            stream.stroke();
            drawAt("AI Tutor", bold, 14, PdfLayout.MARGIN + 28, cy - 4);
            y -= 28;
            stream.setStrokingColor(Color.BLACK);
            stream.setNonStrokingColor(Color.BLACK);
        }

        private void text(String value, PDFont font, float size) throws IOException {
            List<String> lines = PdfLayout.wrap(value, PdfLayout.contentWidth(), line -> width(line, font, size));
            if (lines.isEmpty()) {
                return;
            }
            for (String line : lines) {
                ensure(size + 4);
                drawAt(line, font, size, PdfLayout.MARGIN, y - size);
                y -= size + 3;
            }
        }

        private void drawAt(String value, PDFont font, float size, float x, float baseline) throws IOException {
            float textWidth = width(value, font, size);
            float maxX = PdfLayout.contentRight() - textWidth;
            float drawX = Math.min(Math.max(x, PdfLayout.MARGIN), Math.max(PdfLayout.MARGIN, maxX));
            float drawY = Math.min(Math.max(baseline, PdfLayout.MARGIN), PdfLayout.PAGE_HEIGHT - PdfLayout.MARGIN - size);
            stream.beginText();
            stream.setFont(font, size);
            stream.setNonStrokingColor(Color.BLACK);
            stream.newLineAtOffset(drawX, drawY);
            stream.showText(value);
            stream.endText();
        }

        private void drawKpis(KpiMetricsDto kpis) throws IOException {
            if (kpis == null) {
                text("Chưa có số liệu KPI.", regular, 11);
                return;
            }
            text(
                    "Sĩ số: "
                            + kpis.getStudentCount()
                            + " | Điểm TB: "
                            + plain(kpis.getAverageQuizScore())
                            + " | Giờ tự học TB/tuần: "
                            + plain(kpis.getAverageStudyHoursPerWeek())
                            + " | Lượt làm bài: "
                            + kpis.getQuizAttemptCount(),
                    regular,
                    11);
        }

        private void drawScoreChart(DashboardSummaryResponse summary) throws IOException {
            text("Biểu đồ điểm theo tuần", bold, 12);
            List<ScoreTrendPoint> points =
                    summary == null || summary.getScoreTrend() == null ? List.of() : summary.getScoreTrend();
            float plotHeight = 110;
            ensure(plotHeight + 18);
            float top = y;
            float bottom = top - plotHeight;
            float left = PdfLayout.MARGIN + 28;
            float plotWidth = PdfLayout.contentWidth() - 28;
            axes(left, bottom, plotWidth, plotHeight);
            float maxScore = 10f;
            for (ScoreTrendPoint point : points) {
                if (point.getAverageScore() != null) {
                    maxScore = Math.max(maxScore, point.getAverageScore().floatValue());
                }
            }
            stream.setStrokingColor(new Color(20, 90, 160));
            stream.setLineWidth(1.4f);
            boolean open = false;
            int count = points.size();
            for (int i = 0; i < count; i++) {
                BigDecimal score = points.get(i).getAverageScore();
                float x = count <= 1 ? left + plotWidth / 2 : left + (plotWidth * i / (count - 1));
                if (score == null) {
                    if (open) {
                        stream.stroke();
                        open = false;
                    }
                    continue;
                }
                float py = bottom + (score.floatValue() / maxScore) * (plotHeight - 10);
                if (!open) {
                    stream.moveTo(x, py);
                    open = true;
                } else {
                    stream.lineTo(x, py);
                }
            }
            if (open) {
                stream.stroke();
            }
            stream.setStrokingColor(Color.BLACK);
            labelAxis(left, bottom, "0");
            labelAxis(left, bottom + plotHeight - 12, trimNumber(maxScore));
            y = bottom - 16;
        }

        private void drawStudyChart(DashboardSummaryResponse summary) throws IOException {
            text("Biểu đồ giờ tự học theo thứ", bold, 12);
            List<StudyTimePoint> points = summary == null || summary.getStudyTimeByWeekday() == null
                    ? List.of()
                    : summary.getStudyTimeByWeekday();
            float plotHeight = 100;
            ensure(plotHeight + 22);
            float top = y;
            float bottom = top - plotHeight;
            float left = PdfLayout.MARGIN + 28;
            float plotWidth = PdfLayout.contentWidth() - 28;
            axes(left, bottom, plotWidth, plotHeight);
            float maxHours = 1f;
            for (StudyTimePoint point : points) {
                if (point.getAverageHours() != null) {
                    maxHours = Math.max(maxHours, point.getAverageHours().floatValue());
                }
            }
            int bars = Math.max(points.size(), 1);
            float gap = 8f;
            float barWidth = Math.max(4f, (plotWidth - gap * (bars - 1)) / bars);
            stream.setNonStrokingColor(new Color(46, 125, 190));
            for (int i = 0; i < points.size(); i++) {
                float hours = points.get(i).getAverageHours() == null
                        ? 0f
                        : points.get(i).getAverageHours().floatValue();
                float height = (hours / maxHours) * (plotHeight - 10);
                float x = left + i * (barWidth + gap);
                if (height > 0.5f) {
                    stream.addRect(x, bottom, barWidth, height);
                }
            }
            stream.fill();
            stream.setNonStrokingColor(Color.BLACK);
            for (int i = 0; i < points.size(); i++) {
                String label = points.get(i).getLabel() == null ? "" : points.get(i).getLabel();
                float x = left + i * (barWidth + gap);
                drawAt(label, regular, 8, x, bottom - 12);
            }
            y = bottom - 18;
        }

        private void drawGaps(List<KnowledgeGapItemDto> gaps) throws IOException {
            text("Lỗ hổng kiến thức", bold, 12);
            if (gaps == null || gaps.isEmpty()) {
                text("Không có chủ đề bị hổng trong kỳ đã chọn.", regular, 11);
                return;
            }
            float rankWidth = 28;
            float topicWidth = 150;
            float percentWidth = 48;
            float adviceWidth = PdfLayout.contentWidth() - rankWidth - topicWidth - percentWidth;
            for (KnowledgeGapItemDto gap : gaps) {
                String topic = gap.getTopic() == null ? "" : gap.getTopic();
                String advice = gap.getAdvice() == null ? "" : gap.getAdvice();
                String percent = KnowledgeGapCalculator.formatPercent(gap.getAffectedPercent()) + "%";
                List<String> topicLines = PdfLayout.wrap(topic, topicWidth - 4, line -> width(line, regular, 9));
                List<String> adviceLines = PdfLayout.wrap(advice, adviceWidth - 4, line -> width(line, regular, 9));
                int rows = Math.max(1, Math.max(topicLines.size(), adviceLines.size()));
                float rowHeight = rows * LINE;
                ensure(rowHeight + 4);
                float top = y;
                drawAt(String.valueOf(gap.getRank()), bold, 9, PdfLayout.MARGIN, top - 11);
                drawLines(topicLines, PdfLayout.MARGIN + rankWidth, top);
                drawAt(percent, regular, 9, PdfLayout.MARGIN + rankWidth + topicWidth, top - 11);
                drawLines(adviceLines, PdfLayout.MARGIN + rankWidth + topicWidth + percentWidth, top);
                y = top - rowHeight;
            }
        }

        private void drawLines(List<String> lines, float x, float top) throws IOException {
            if (lines.isEmpty()) {
                return;
            }
            float baseline = top - 11;
            for (String line : lines) {
                drawAt(line, regular, 9, x, baseline);
                baseline -= LINE;
            }
        }

        private void axes(float left, float bottom, float width, float height) throws IOException {
            stream.setStrokingColor(Color.DARK_GRAY);
            stream.setLineWidth(0.8f);
            stream.moveTo(left, bottom);
            stream.lineTo(left + width, bottom);
            stream.stroke();
            stream.moveTo(left, bottom);
            stream.lineTo(left, bottom + height);
            stream.stroke();
        }

        private void labelAxis(float left, float baseline, String label) throws IOException {
            drawAt(label, regular, 8, PdfLayout.MARGIN, baseline);
        }

        private void circle(float cx, float cy, float radius) throws IOException {
            float k = 0.55228475f;
            stream.moveTo(cx + radius, cy);
            stream.curveTo(cx + radius, cy + k * radius, cx + k * radius, cy + radius, cx, cy + radius);
            stream.curveTo(cx - k * radius, cy + radius, cx - radius, cy + k * radius, cx - radius, cy);
            stream.curveTo(cx - radius, cy - k * radius, cx - k * radius, cy - radius, cx, cy - radius);
            stream.curveTo(cx + k * radius, cy - radius, cx + radius, cy - k * radius, cx + radius, cy);
            stream.closePath();
        }

        private float width(String text, PDFont font, float size) {
            try {
                return font.getStringWidth(text) / 1000f * size;
            } catch (IOException ex) {
                return text.length() * size * 0.5f;
            }
        }
    }

    private static String plain(BigDecimal value) {
        return value == null ? "-" : value.toPlainString();
    }

    private static String trimNumber(float value) {
        if (Math.abs(value - Math.rint(value)) < 0.05f) {
            return String.valueOf(Math.round(value));
        }
        return String.format(java.util.Locale.US, "%.1f", value);
    }
}
