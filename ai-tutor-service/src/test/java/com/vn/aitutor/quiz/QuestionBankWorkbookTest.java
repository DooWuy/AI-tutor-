package com.vn.aitutor.quiz;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.dto.request.quiz.QuestionUpsertRequest;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.quiz.QuestionBankWorkbook.ImportedRow;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

class QuestionBankWorkbookTest {

    @Test
    void templateContainsOneRowOfEachOfficialType() {
        List<ImportedRow> rows = QuestionBankWorkbook.read(QuestionBankWorkbook.template());

        assertEquals(4, rows.size());
        assertEquals(2, rows.get(0).rowNumber());
        QuestionUpsertRequest multipleChoice = rows.get(0).request();
        assertEquals("MULTIPLE_CHOICE", multipleChoice.getQuestionType());
        assertEquals(2, multipleChoice.getDifficulty());
        assertTrue(multipleChoice.getChoices().stream().anyMatch(choice -> choice.isCorrect() && "B".equals(choice.getKey())));

        assertEquals("TRUE_FALSE", rows.get(1).request().getQuestionType());
        assertEquals(2, rows.get(1).request().getChoices().size());
        assertTrue(rows.get(1).request().getChoices().get(0).isCorrect());

        QuestionUpsertRequest fill = rows.get(2).request();
        assertEquals("FILL_BLANK", fill.getQuestionType());
        assertEquals("8", fill.getCorrectText());
        assertTrue(fill.getChoices().isEmpty());

        QuestionUpsertRequest multi = rows.get(3).request();
        assertEquals("MULTI_SELECT", multi.getQuestionType());
        assertEquals(4, multi.getChoices().size());
        assertTrue(multi.getChoices().stream().filter(choice -> choice.isCorrect()).map(choice -> choice.getKey()).toList()
                .containsAll(List.of("A", "C")));
        assertEquals(2, multi.getChoices().stream().filter(choice -> choice.isCorrect()).count());
    }

    @Test
    void blankRowIsSkippedAndABadTypeStaysOnItsExcelRow() throws IOException {
        byte[] content = sheet(new String[][] {
            QuestionBankWorkbook.HEADERS,
            {"Trắc nghiệm", "Tính giá trị của biểu thức 1 + 1.", "Cộng hai số tự nhiên với nhau.", "2", "", "1", "2", "3", "4", "", "", "B"},
            {"", "", "", "", "", "", "", "", "", "", "", ""},
            {"Tự luận", "Câu này không thuộc ba loại được hỗ trợ.", "Lời giải đủ dài để qua kiểm tra.", "3", "", "", "", "", "", "", "", "A"}
        });

        List<ImportedRow> rows = QuestionBankWorkbook.read(content);

        assertEquals(2, rows.size());
        assertNull(rows.get(0).error());
        assertEquals(4, rows.get(1).rowNumber());
        assertEquals("Loại câu hỏi phải là Trắc nghiệm, Trắc nghiệm nhiều đáp án, Đúng/Sai hoặc Điền từ", rows.get(1).error());
    }

    @Test
    void multiSelectMarksEveryListedKey() throws IOException {
        byte[] content = sheet(new String[][] {
            QuestionBankWorkbook.HEADERS,
            {"Trắc nghiệm nhiều đáp án", "Những số nào sau đây là số chẵn?", "Số chẵn chia hết cho hai.", "2", "", "2", "3", "4", "5", "", "", "a; c"}
        });

        List<ImportedRow> rows = QuestionBankWorkbook.read(content);

        assertNull(rows.get(0).error());
        assertEquals("MULTI_SELECT", rows.get(0).request().getQuestionType());
        assertTrue(rows.get(0).request().getChoices().stream().filter(choice -> choice.isCorrect()).map(choice -> choice.getKey()).toList()
                .containsAll(List.of("A", "C")));
    }

    @Test
    void missingRequiredColumnIsRejected() throws IOException {
        byte[] content = sheet(new String[][] {
            {"Nội dung", "Giải thích"},
            {"Một câu hỏi đủ dài", "Một lời giải đủ dài"}
        });

        ResourceBadRequestException error = assertThrows(ResourceBadRequestException.class, () -> QuestionBankWorkbook.read(content));

        assertTrue(error.getMessage().contains("Loại"));
        assertTrue(error.getMessage().contains("Đáp án đúng"));
    }

    @Test
    void writeSampleFiles() throws IOException {
        byte[] content = sheet(new String[][] {
            QuestionBankWorkbook.HEADERS,
            {"Trắc nghiệm", "Cho hàm số y = f(x) đồng biến trên khoảng (a; b). Khẳng định nào đúng?", "Định nghĩa hàm số đồng biến trên một khoảng.", "2", "đơn điệu", "f'(x) >= 0", "f'(x) < 0", "f'(x) = 0", "Không xác định", "", "", "A"},
            {"Tự luận", "Câu này có loại không hợp lệ để test báo lỗi dòng.", "Lời giải chi tiết câu hỏi tự luận.", "3", "", "", "", "", "", "", "", "A"},
            {"Đúng/Sai", "Hàm số y = x^3 luôn đồng biến trên tập số thực R.", "Đạo hàm y' = 3x^2 >= 0 với mọi x thuộc R.", "1", "đồng biến", "Đúng", "Sai", "", "", "", "", "Đúng"}
        });
        java.nio.file.Path target = java.nio.file.Path.of("build/mixed_test.xlsx");
        if (target.getParent() != null) {
            java.nio.file.Files.createDirectories(target.getParent());
        }
        java.nio.file.Files.write(target, content);
    }

    private static byte[] sheet(String[][] rows) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet();
            for (int r = 0; r < rows.length; r++) {
                var row = sheet.createRow(r);
                for (int c = 0; c < rows[r].length; c++) {
                    row.createCell(c).setCellValue(rows[r][c]);
                }
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }
}
