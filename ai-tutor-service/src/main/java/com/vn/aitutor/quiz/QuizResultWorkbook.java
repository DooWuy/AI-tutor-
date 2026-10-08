package com.vn.aitutor.quiz;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public final class QuizResultWorkbook {

    private static final DateTimeFormatter SUBMITTED_AT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final String[] HEADERS = {
        "Mã học sinh",
        "Họ tên",
        "Lớp",
        "Môn",
        "Đề thi",
        "Điểm",
        "Đạt yêu cầu",
        "Thời lượng (giây)",
        "Thời điểm nộp"
    };

    private QuizResultWorkbook() {
    }

    public static byte[] write(List<RowData> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ket qua");
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                header.createCell(i).setCellValue(HEADERS[i]);
            }
            int rowIndex = 1;
            for (RowData row : rows) {
                Row excelRow = sheet.createRow(rowIndex++);
                excelRow.createCell(0).setCellValue(text(row.studentCode()));
                excelRow.createCell(1).setCellValue(text(row.fullName()));
                excelRow.createCell(2).setCellValue(text(row.className()));
                excelRow.createCell(3).setCellValue(text(row.subject()));
                excelRow.createCell(4).setCellValue(text(row.quizTitle()));
                excelRow.createCell(5).setCellValue(row.score());
                excelRow.createCell(6).setCellValue(row.passed() ? "Đạt" : "Chưa đạt");
                if (row.durationSeconds() == null) {
                    excelRow.createCell(7).setCellValue("");
                } else {
                    excelRow.createCell(7).setCellValue(row.durationSeconds());
                }
                excelRow.createCell(8).setCellValue(row.submittedAt() == null ? "" : SUBMITTED_AT.format(row.submittedAt()));
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Không tạo được file Excel", ex);
        }
    }

    private static String text(String value) {
        return value == null ? "" : value;
    }

    public record RowData(
            String studentCode,
            String fullName,
            String className,
            String subject,
            String quizTitle,
            double score,
            boolean passed,
            Integer durationSeconds,
            Instant submittedAt) {
    }
}
