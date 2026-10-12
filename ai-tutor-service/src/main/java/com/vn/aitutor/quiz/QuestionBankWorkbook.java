package com.vn.aitutor.quiz;

import com.vn.aitutor.dto.request.QuestionChoiceRequest;
import com.vn.aitutor.dto.request.QuestionUpsertRequest;
import com.vn.aitutor.exception.ResourceBadRequestException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public final class QuestionBankWorkbook {

    public static final int MAX_ROWS = 500;
    static final String[] HEADERS = {
        "Loại", "Nội dung", "Giải thích", "Độ khó", "Thẻ", "A", "B", "C", "D", "E", "F", "Đáp án đúng"
    };
    private static final String[] CHOICE_KEYS = {"A", "B", "C", "D", "E", "F"};

    private QuestionBankWorkbook() {
    }

    public static byte[] template() {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Cau hoi");
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                header.createCell(i).setCellValue(HEADERS[i]);
                sheet.setColumnWidth(i, (i == 1 || i == 2 ? 42 : 16) * 256);
            }
            writeRow(sheet, 1, "Trắc nghiệm", "Tính giá trị của biểu thức 1 + 1.",
                    "Cộng hai số tự nhiên với nhau.", 2, "cộng",
                    new String[] {"1", "2", "3", "4", "", ""}, "B");
            writeRow(sheet, 2, "Đúng/Sai", "Số 4 là một số chẵn.",
                    "Số chẵn là số chia hết cho 2.", 1, "",
                    new String[] {"Đúng", "Sai", "", "", "", ""}, "Đúng");
            writeRow(sheet, 3, "Điền từ", "Điền số tiếp theo của dãy 2, 4, 6.",
                    "Dãy tăng thêm 2 ở mỗi số hạng.", 3, "dãy số",
                    new String[] {"", "", "", "", "", ""}, "8");
            writeRow(sheet, 4, "Trắc nghiệm nhiều đáp án", "Những số nào sau đây là số chẵn?",
                    "Số chẵn là số chia hết cho 2.", 2, "số chẵn",
                    new String[] {"2", "3", "4", "5", "", ""}, "A,C");
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new UncheckedIOException("Không tạo được file Excel", ex);
        }
    }

    public static List<ImportedRow> read(byte[] content) {
        if (content == null || content.length == 0) {
            throw new ResourceBadRequestException("Hãy chọn file Excel");
        }
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(content))) {
            Sheet sheet = workbook.getNumberOfSheets() == 0 ? null : workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new ResourceBadRequestException("File Excel không có dòng tiêu đề");
            }
            DataFormatter formatter = new DataFormatter();
            Map<String, Integer> columns = headerColumns(sheet.getRow(0), formatter);
            List<ImportedRow> rows = new ArrayList<>();
            int last = sheet.getLastRowNum();
            for (int index = 1; index <= last; index++) {
                ImportedRow parsed = parseRow(index + 1, sheet.getRow(index), columns, formatter);
                if (parsed == null) {
                    continue;
                }
                rows.add(parsed);
                if (rows.size() > MAX_ROWS) {
                    throw new ResourceBadRequestException("Mỗi lần nhập tối đa " + MAX_ROWS + " câu hỏi");
                }
            }
            if (rows.isEmpty()) {
                throw new ResourceBadRequestException("File không có câu hỏi");
            }
            return rows;
        } catch (ResourceBadRequestException ex) {
            throw ex;
        } catch (RuntimeException | IOException ex) {
            throw new ResourceBadRequestException("File không phải Excel .xlsx hợp lệ");
        }
    }

    private static Map<String, Integer> headerColumns(Row header, DataFormatter formatter) {
        Map<String, Integer> columns = new LinkedHashMap<>();
        if (header != null) {
            for (int index = 0; index < header.getLastCellNum(); index++) {
                String key = fold(cell(header, index, formatter));
                if (!key.isBlank()) {
                    columns.putIfAbsent(key, index);
                }
            }
        }
        List<String> missing = new ArrayList<>();
        if (!columns.containsKey("loai")) missing.add("Loại");
        if (!columns.containsKey("noidung")) missing.add("Nội dung");
        if (!columns.containsKey("giaithich")) missing.add("Giải thích");
        if (!columns.containsKey("dokho")) missing.add("Độ khó");
        if (!columns.containsKey("dapandung")) missing.add("Đáp án đúng");
        if (!missing.isEmpty()) {
            throw new ResourceBadRequestException("File Excel thiếu cột " + String.join(", ", missing));
        }
        return columns;
    }

    private static ImportedRow parseRow(int rowNumber, Row row, Map<String, Integer> columns, DataFormatter formatter) {
        String typeRaw = value(row, columns, "loai", formatter);
        String stem = value(row, columns, "noidung", formatter);
        String explanation = value(row, columns, "giaithich", formatter);
        String difficultyRaw = value(row, columns, "dokho", formatter);
        String tagsRaw = value(row, columns, "the", formatter);
        String answer = value(row, columns, "dapandung", formatter);
        List<QuestionChoiceRequest> choices = new ArrayList<>();
        boolean anyChoice = false;
        for (String key : CHOICE_KEYS) {
            String text = value(row, columns, key.toLowerCase(Locale.ROOT), formatter);
            if (text.isBlank()) {
                continue;
            }
            anyChoice = true;
            QuestionChoiceRequest choice = new QuestionChoiceRequest();
            choice.setKey(key);
            choice.setText(text);
            choices.add(choice);
        }
        if (typeRaw.isBlank() && stem.isBlank() && explanation.isBlank() && difficultyRaw.isBlank()
                && answer.isBlank() && !anyChoice) {
            return null;
        }
        String type = questionType(typeRaw);
        if (type == null) {
            return new ImportedRow(rowNumber, null,
                    "Loại câu hỏi phải là Trắc nghiệm, Trắc nghiệm nhiều đáp án, Đúng/Sai hoặc Điền từ");
        }
        Integer difficulty = difficulty(difficultyRaw);
        if (difficulty == null) {
            return new ImportedRow(rowNumber, null, "Độ khó không được để trống");
        }
        if ("TRUE_FALSE".equals(type) && choices.isEmpty()) {
            choices.add(choice("A", "Đúng"));
            choices.add(choice("B", "Sai"));
        }
        if (!"FILL_BLANK".equals(type)) {
            markCorrect(choices, answer);
        }
        QuestionUpsertRequest request = new QuestionUpsertRequest();
        request.setQuestionType(type);
        request.setStem(stem);
        request.setExplanation(explanation);
        request.setDifficulty(difficulty);
        request.setTags(splitTags(tagsRaw));
        request.setChoices("FILL_BLANK".equals(type) ? List.of() : choices);
        request.setCorrectText("FILL_BLANK".equals(type) ? answer : null);
        return new ImportedRow(rowNumber, request, null);
    }

    private static void markCorrect(List<QuestionChoiceRequest> choices, String answer) {
        String wanted = answer.trim();
        boolean whole = choices.stream().anyMatch(choice ->
                choice.getKey().equalsIgnoreCase(wanted) || choice.getText().equalsIgnoreCase(wanted));
        List<String> tokens = new ArrayList<>();
        if (whole || wanted.isEmpty()) {
            tokens.add(wanted);
        } else {
            for (String part : wanted.split("[,;]")) {
                if (!part.isBlank()) {
                    tokens.add(part.trim());
                }
            }
        }
        for (QuestionChoiceRequest choice : choices) {
            boolean matched = tokens.stream().anyMatch(token ->
                    choice.getKey().equalsIgnoreCase(token) || choice.getText().equalsIgnoreCase(token));
            choice.setCorrect(matched);
        }
    }

    private static QuestionChoiceRequest choice(String key, String text) {
        QuestionChoiceRequest choice = new QuestionChoiceRequest();
        choice.setKey(key);
        choice.setText(text);
        return choice;
    }

    private static List<String> splitTags(String raw) {
        if (raw.isBlank()) {
            return List.of();
        }
        List<String> tags = new ArrayList<>();
        for (String part : raw.split("[,;]")) {
            if (!part.isBlank()) {
                tags.add(part.trim());
            }
        }
        return tags;
    }

    private static String questionType(String raw) {
        String key = fold(raw);
        return switch (key) {
            case "tracnghiem", "multiplechoice", "mc" -> "MULTIPLE_CHOICE";
            case "tracnghiemnhieudapan", "tracnghiemnhieudapandung", "chonnhieu", "chonnhieudapan",
                    "nhieudapan", "multiselect", "multipleanswer", "multipleanswers", "multipleresponse" -> "MULTI_SELECT";
            case "dungsai", "truefalse", "tf" -> "TRUE_FALSE";
            case "dientu", "dienkhuyet", "fillblank", "fillinblank", "shortanswer", "traloingan" -> "FILL_BLANK";
            default -> null;
        };
    }

    private static Integer difficulty(String raw) {
        if (raw.isBlank()) {
            return null;
        }
        try {
            double value = Double.parseDouble(raw.replace(',', '.'));
            if (value != Math.rint(value)) {
                return 0;
            }
            return (int) value;
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private static String value(Row row, Map<String, Integer> columns, String key, DataFormatter formatter) {
        Integer index = columns.get(key);
        if (index == null) {
            return "";
        }
        return cell(row, index, formatter);
    }

    private static String cell(Row row, int index, DataFormatter formatter) {
        if (row == null) {
            return "";
        }
        Cell cell = row.getCell(index);
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell).trim();
    }

    private static String fold(String raw) {
        String lower = raw == null ? "" : raw.trim().toLowerCase(Locale.forLanguageTag("vi")).replace('đ', 'd');
        String stripped = Normalizer.normalize(lower, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return stripped.replaceAll("[^a-z0-9]", "");
    }

    private static void writeRow(
            Sheet sheet,
            int index,
            String type,
            String stem,
            String explanation,
            int difficulty,
            String tags,
            String[] choices,
            String answer) {
        Row row = sheet.createRow(index);
        row.createCell(0).setCellValue(type);
        row.createCell(1).setCellValue(stem);
        row.createCell(2).setCellValue(explanation);
        row.createCell(3).setCellValue(difficulty);
        row.createCell(4).setCellValue(tags);
        for (int i = 0; i < choices.length; i++) {
            row.createCell(5 + i).setCellValue(choices[i]);
        }
        row.createCell(11).setCellValue(answer);
    }

    public record ImportedRow(int rowNumber, QuestionUpsertRequest request, String error) {
    }
}
