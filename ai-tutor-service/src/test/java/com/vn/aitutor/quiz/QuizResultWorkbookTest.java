package com.vn.aitutor.quiz;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.vn.aitutor.quiz.QuizResultWorkbook.RowData;
import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.List;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

class QuizResultWorkbookTest {

    @Test
    void writesPassedColumnForEachSubmittedAttempt() throws Exception {
        byte[] bytes = QuizResultWorkbook.write(List.of(new RowData(
                "HS01", "Nguyễn A", "12A1", "Toán", "Kiểm tra 15 phút", 7.5, true, 90, Instant.parse("2026-10-08T01:00:00Z"))));

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            assertEquals("Đạt yêu cầu", sheet.getRow(0).getCell(6).getStringCellValue());
            assertEquals("Đạt", sheet.getRow(1).getCell(6).getStringCellValue());
            assertEquals(7.5, sheet.getRow(1).getCell(5).getNumericCellValue());
        }
    }
}
