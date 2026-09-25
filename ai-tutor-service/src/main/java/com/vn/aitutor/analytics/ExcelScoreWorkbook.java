package com.vn.aitutor.analytics;

import com.vn.aitutor.repository.projection.RawScoreRow;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public final class ExcelScoreWorkbook {

    private static final DateTimeFormatter SUBMITTED_AT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
    private static final String[] HEADERS = {
        "Mã học sinh",
        "Họ tên",
        "Lớp",
        "Môn",
        "Bài kiểm tra",
        "Điểm",
        "Thời lượng (giây)",
        "Thời điểm nộp"
    };

    private ExcelScoreWorkbook() {}

    public static byte[] write(List<RawScoreRow> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Diem so");
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                header.createCell(i).setCellValue(HEADERS[i]);
            }
            if (rows != null) {
                int rowIndex = 1;
                for (RawScoreRow row : rows) {
                    Row excelRow = sheet.createRow(rowIndex++);
                    excelRow.createCell(0).setCellValue(text(row.getStudentCode()));
                    excelRow.createCell(1).setCellValue(text(row.getFullName()));
                    excelRow.createCell(2).setCellValue(text(row.getClassName()));
                    excelRow.createCell(3).setCellValue(text(row.getSubject()));
                    excelRow.createCell(4).setCellValue(text(row.getQuizTitle()));
                    if (row.getScore() != null) {
                        excelRow.createCell(5).setCellValue(row.getScore());
                    } else {
                        excelRow.createCell(5).setCellValue("");
                    }
                    if (row.getDurationSeconds() != null) {
                        excelRow.createCell(6).setCellValue(row.getDurationSeconds());
                    } else {
                        excelRow.createCell(6).setCellValue("");
                    }
                    excelRow.createCell(7)
                            .setCellValue(row.getSubmittedAt() == null ? "" : SUBMITTED_AT.format(row.getSubmittedAt()));
                }
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
}
