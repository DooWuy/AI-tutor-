package com.vn.aitutor.quiz;

import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.exception.ResourceBadRequestException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

public final class QuestionContentRules {

    public static final String DELETE_BLOCKED =
            "Không thể xóa đề thi này vì đã có học sinh làm bài. Bạn chỉ có thể chuyển trạng thái đề thi sang Ngừng hoạt động (Draft/Archived).";

    private static final Pattern VIETNAMESE = Pattern.compile(
            "[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    private static final String KEYS = "ABCDEF";

    private QuestionContentRules() {
    }

    public static NormalizedQuestion require(
            String stem,
            String explanation,
            QuestionType type,
            List<ChoiceInput> choices,
            List<String> tags,
            int difficulty,
            String correctText,
            Integer exactChoiceCount,
            boolean requireVietnameseExplanation) {
        String cleanStem = requireLength(stem, "Nội dung câu hỏi", 10, 2000);
        String cleanExplanation = requireLength(explanation, "Lời giải thích", 10, 2000);
        if (requireVietnameseExplanation && !VIETNAMESE.matcher(cleanExplanation).find()) {
            throw new ResourceBadRequestException("Lời giải thích phải bằng tiếng Việt");
        }
        if (difficulty < 1 || difficulty > 5) {
            throw new ResourceBadRequestException("Độ khó phải từ 1 đến 5");
        }
        QuestionType resolved = type == null ? QuestionType.MULTIPLE_CHOICE : type;
        List<String> cleanTags = normalizeTags(tags);
        if (resolved == QuestionType.FILL_BLANK) {
            String answer = requireLength(correctText, "Đáp án điền từ", 1, 500);
            return new NormalizedQuestion(
                    cleanStem, cleanExplanation, difficulty, resolved, cleanTags, List.of(), answer);
        }
        int min = resolved == QuestionType.TRUE_FALSE ? 2 : 2;
        int max = resolved == QuestionType.TRUE_FALSE ? 2 : 6;
        if (exactChoiceCount != null) {
            min = exactChoiceCount;
            max = exactChoiceCount;
        }
        List<ChoiceInput> cleanChoices = normalizeChoices(choices, min, max);
        return new NormalizedQuestion(
                cleanStem, cleanExplanation, difficulty, resolved, cleanTags, cleanChoices, null);
    }

    public static Optional<NormalizedQuestion> tryAccept(
            String stem,
            String explanation,
            QuestionType type,
            List<ChoiceInput> choices,
            List<String> tags,
            int difficulty,
            String correctText,
            int exactChoiceCount) {
        try {
            return Optional.of(require(
                    stem,
                    explanation,
                    type,
                    choices,
                    tags,
                    difficulty,
                    correctText,
                    type == QuestionType.FILL_BLANK ? null : exactChoiceCount,
                    true));
        } catch (ResourceBadRequestException ex) {
            return Optional.empty();
        }
    }

    public static void requireGenerateCount(int count) {
        if (count < 1 || count > 20) {
            throw new ResourceBadRequestException("Số lượng câu hỏi phải từ 1 đến 20");
        }
    }

    public static void requireDifficulty(int difficulty) {
        if (difficulty < 1 || difficulty > 5) {
            throw new ResourceBadRequestException("Độ khó phải từ 1 đến 5");
        }
    }

    private static List<ChoiceInput> normalizeChoices(List<ChoiceInput> choices, int min, int max) {
        if (choices == null || choices.size() < min || choices.size() > max) {
            throw new ResourceBadRequestException(
                    "Câu hỏi cần từ " + min + " đến " + max + " phương án");
        }
        List<ChoiceInput> cleaned = new ArrayList<>();
        Set<String> keys = new LinkedHashSet<>();
        int correct = 0;
        for (int i = 0; i < choices.size(); i++) {
            ChoiceInput choice = choices.get(i);
            String text = choice == null ? "" : safe(choice.text());
            if (text.length() < 1 || text.length() > 1000) {
                throw new ResourceBadRequestException("Mỗi phương án phải từ 1 đến 1000 ký tự");
            }
            String key = choice == null ? "" : safe(choice.key()).toUpperCase(Locale.ROOT);
            if (key.isBlank()) {
                key = String.valueOf(KEYS.charAt(i));
            }
            if (key.length() > 8 || !keys.add(key)) {
                throw new ResourceBadRequestException("Mã phương án bị trùng hoặc không hợp lệ");
            }
            boolean isCorrect = choice != null && choice.correct();
            if (isCorrect) {
                correct++;
            }
            cleaned.add(new ChoiceInput(key, text, isCorrect));
        }
        if (correct != 1) {
            throw new ResourceBadRequestException("Phải có đúng một đáp án đúng");
        }
        return cleaned;
    }

    private static List<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return List.of();
        }
        List<String> cleaned = new ArrayList<>();
        for (String tag : tags) {
            if (tag == null || tag.isBlank()) {
                continue;
            }
            String value = tag.trim();
            if (value.length() > 50 || cleaned.contains(value)) {
                continue;
            }
            cleaned.add(value);
            if (cleaned.size() == 10) {
                break;
            }
        }
        return cleaned;
    }

    private static String requireLength(String raw, String label, int min, int max) {
        String value = safe(raw);
        if (value.length() < min || value.length() > max) {
            throw new ResourceBadRequestException(label + " phải từ " + min + " đến " + max + " ký tự");
        }
        return value;
    }

    private static String safe(String raw) {
        return raw == null ? "" : raw.trim();
    }
}
