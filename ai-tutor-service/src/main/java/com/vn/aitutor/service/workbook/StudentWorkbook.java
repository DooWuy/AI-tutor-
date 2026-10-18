package com.vn.aitutor.service.workbook;

import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.exception.ResourceBadRequestException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Slf4j
public final class StudentWorkbook {

    public static final int MAX_ROWS = 500;
    static final String[] HEADERS = {
        "STT",
        "Tên đăng nhập (*)",
        "Email (*)",
        "Họ và tên (*)",
        "Mật khẩu",
        "Ngày sinh (yyyy-MM-dd)",
        "Giới tính (NAM/NU/KHAC)",
        "Số điện thoại",
        "Trường học (*)",
        "Khối lớp (*)",
        "Tên lớp",
        "Địa chỉ",
        "Tên phụ huynh",
        "SĐT phụ huynh",
        "Email phụ huynh"
    };

    private static final DateTimeFormatter[] DATE_FORMATTERS = new DateTimeFormatter[] {
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("d/M/yyyy"),
        DateTimeFormatter.ofPattern("yyyy/MM/dd")
    };

    private StudentWorkbook() {}

    public static byte[] template() {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Danh sach hoc sinh");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, (i == 1 || i == 2 || i == 3 || i == 8 || i == 11 ? 25 : 18) * 256);
            }

            // Sample rows
            writeSampleRow(sheet, 1, 1, "hocsinh01", "hocsinh01@example.com", "Nguyễn Văn An", "Student@123",
                    "2008-05-15", "NAM", "0912345678", "THPT Chuyên Lê Hồng Phong", "Khối 11", "11A1",
                    "Quận 5, TP.HCM", "Nguyễn Văn Bình", "0909123456", "binh.nguyen@example.com");

            writeSampleRow(sheet, 2, 2, "hocsinh02", "hocsinh02@example.com", "Trần Thị Mai", "Student@123",
                    "2008-09-20", "NU", "0987654321", "THPT Chuyên Lê Hồng Phong", "Khối 11", "11A1",
                    "Quận 1, TP.HCM", "Trần Văn Cường", "0918765432", "cuong.tran@example.com");

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Không thể tạo file Excel mẫu", ex);
        }
    }

    private static void writeSampleRow(Sheet sheet, int rowIdx, int stt, String username, String email,
                                       String fullName, String password, String dob, String gender,
                                       String phone, String school, String grade, String className,
                                       String address, String parentName, String parentPhone, String parentEmail) {
        Row row = sheet.createRow(rowIdx);
        row.createCell(0).setCellValue(stt);
        row.createCell(1).setCellValue(username);
        row.createCell(2).setCellValue(email);
        row.createCell(3).setCellValue(fullName);
        row.createCell(4).setCellValue(password);
        row.createCell(5).setCellValue(dob);
        row.createCell(6).setCellValue(gender);
        row.createCell(7).setCellValue(phone);
        row.createCell(8).setCellValue(school);
        row.createCell(9).setCellValue(grade);
        row.createCell(10).setCellValue(className);
        row.createCell(11).setCellValue(address);
        row.createCell(12).setCellValue(parentName);
        row.createCell(13).setCellValue(parentPhone);
        row.createCell(14).setCellValue(parentEmail);
    }

    public static List<StudentExcelRow> read(byte[] content) {
        if (content == null || content.length == 0) {
            throw new ResourceBadRequestException("Hãy chọn file Excel danh sách học sinh");
        }
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            Sheet sheet = workbook.getNumberOfSheets() == 0 ? null : workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new ResourceBadRequestException("File Excel rỗng hoặc không có dữ liệu");
            }
            DataFormatter formatter = new DataFormatter();
            List<StudentExcelRow> rows = new ArrayList<>();
            int lastRow = sheet.getLastRowNum();

            for (int r = 1; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row, formatter)) {
                    continue;
                }
                if (rows.size() >= MAX_ROWS) {
                    throw new ResourceBadRequestException("Chỉ cho phép nhập tối đa " + MAX_ROWS + " học sinh mỗi lần");
                }

                int rowNum = r + 1; // 1-based row number for display
                String username = safeTrim(formatter.formatCellValue(row.getCell(1)));
                String email = safeTrim(formatter.formatCellValue(row.getCell(2)));
                String fullName = safeTrim(formatter.formatCellValue(row.getCell(3)));
                String password = safeTrim(formatter.formatCellValue(row.getCell(4)));
                String dobRaw = safeTrim(formatter.formatCellValue(row.getCell(5)));
                String genderRaw = safeTrim(formatter.formatCellValue(row.getCell(6)));
                String phone = safeTrim(formatter.formatCellValue(row.getCell(7)));
                String school = safeTrim(formatter.formatCellValue(row.getCell(8)));
                String grade = safeTrim(formatter.formatCellValue(row.getCell(9)));
                String className = safeTrim(formatter.formatCellValue(row.getCell(10)));
                String address = safeTrim(formatter.formatCellValue(row.getCell(11)));
                String parentName = safeTrim(formatter.formatCellValue(row.getCell(12)));
                String parentPhone = safeTrim(formatter.formatCellValue(row.getCell(13)));
                String parentEmail = safeTrim(formatter.formatCellValue(row.getCell(14)));

                LocalDate dateOfBirth = parseDate(dobRaw);
                Gender gender = parseGender(genderRaw);

                rows.add(StudentExcelRow.builder()
                        .rowNumber(rowNum)
                        .username(username)
                        .email(email)
                        .fullName(fullName)
                        .password(password == null || password.isBlank() ? "Student@123" : password)
                        .dateOfBirth(dateOfBirth)
                        .gender(gender)
                        .phoneNumber(phone)
                        .schoolName(school)
                        .gradeLevel(grade)
                        .className(className)
                        .address(address)
                        .parentName(parentName)
                        .parentPhone(parentPhone)
                        .parentEmail(parentEmail)
                        .build());
            }

            if (rows.isEmpty()) {
                throw new ResourceBadRequestException("Không tìm thấy dòng dữ liệu học sinh nào trong file");
            }
            return rows;
        } catch (IOException ex) {
            throw new UncheckedIOException("Không thể đọc file Excel", ex);
        }
    }

    private static boolean isRowEmpty(Row row, DataFormatter formatter) {
        for (int c = 1; c <= 3; c++) {
            Cell cell = row.getCell(c);
            if (cell != null && !formatter.formatCellValue(cell).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private static String safeTrim(String val) {
        return (val == null || val.trim().isEmpty()) ? null : val.trim();
    }

    private static LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) return null;
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(raw.trim(), fmt);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private static Gender parseGender(String raw) {
        if (raw == null || raw.isBlank()) return Gender.OTHER;
        String val = raw.trim().toUpperCase();
        if (val.contains("NAM") || val.equals("MALE") || val.equals("M")) return Gender.MALE;
        if (val.contains("NU") || val.contains("NỮ") || val.equals("FEMALE") || val.equals("F")) return Gender.FEMALE;
        return Gender.OTHER;
    }

    @Data
    @Builder
    public static class StudentExcelRow {
        private int rowNumber;
        private String username;
        private String email;
        private String fullName;
        private String password;
        private LocalDate dateOfBirth;
        private Gender gender;
        private String phoneNumber;
        private String schoolName;
        private String gradeLevel;
        private String className;
        private String address;
        private String parentName;
        private String parentPhone;
        private String parentEmail;
    }
}
