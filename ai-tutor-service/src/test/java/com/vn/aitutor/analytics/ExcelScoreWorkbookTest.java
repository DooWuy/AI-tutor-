package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.vn.aitutor.repository.projection.RawScoreRow;
import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

class ExcelScoreWorkbookTest {

    @Test
    void rawScoresKeepAc01TotalWithoutAddingAttempts() throws Exception {
        List<RawScoreRow> rows = new ArrayList<>();
        for (int i = 0; i < 80; i++) {
            rows.add(new FixedRow(8.0));
        }
        byte[] bytes = ExcelScoreWorkbook.write(rows);
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            assertEquals("Mã học sinh", sheet.getRow(0).getCell(0).getStringCellValue());
            assertEquals("Điểm", sheet.getRow(0).getCell(5).getStringCellValue());
            assertEquals(80, sheet.getLastRowNum());
            double sum = 0;
            for (int i = 1; i <= 80; i++) {
                sum += sheet.getRow(i).getCell(5).getNumericCellValue();
            }
            assertEquals(640.0, sum, 0.001);
        }
    }

    @Test
    void emptyClassStillWritesHeader() throws Exception {
        byte[] bytes = ExcelScoreWorkbook.write(List.of());
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            assertEquals(0, sheet.getLastRowNum());
            assertEquals("Bài kiểm tra", sheet.getRow(0).getCell(4).getStringCellValue());
        }
    }

    private record FixedRow(double score) implements RawScoreRow {
        @Override
        public String getStudentCode() {
            return "STU-12A1-01";
        }

        @Override
        public String getFullName() {
            return "Nguyễn Văn A";
        }

        @Override
        public String getClassName() {
            return "12A1";
        }

        @Override
        public String getSubject() {
            return "TOAN";
        }

        @Override
        public String getQuizTitle() {
            return "Kiểm tra Toán tuần — Tiệm cận";
        }

        @Override
        public Double getScore() {
            return score;
        }

        @Override
        public Integer getDurationSeconds() {
            return 1800;
        }

        @Override
        public Instant getSubmittedAt() {
            return Instant.parse("2026-09-20T03:00:00Z");
        }
    }
}
