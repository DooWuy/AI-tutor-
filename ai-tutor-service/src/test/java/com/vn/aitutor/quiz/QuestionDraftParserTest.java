package com.vn.aitutor.quiz;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.entity.enums.QuestionType;
import java.util.List;
import org.junit.jupiter.api.Test;

class QuestionDraftParserTest {

    @Test
    void acceptsFiveLevelFourDerivativeQuestionsAndDropsInvalidOnes() {
        String raw = """
                ```json
                {"questions":[
                  %s,
                  {"stem":"Câu hỏng","explanation":"ngắn","choices":[{"key":"A","text":"chỉ một","correct":true}]}
                ]}
                ```
                """.formatted(validItems());

        List<NormalizedQuestion> questions = QuestionDraftParser.parse(
                raw, QuestionType.MULTIPLE_CHOICE, 4, 4, List.of());

        assertEquals(5, questions.size());
        assertTrue(questions.stream().allMatch(question -> question.difficulty() == 4));
        assertTrue(questions.stream().allMatch(question -> question.choices().size() == 4));
        assertTrue(questions.stream().allMatch(question -> question.choices().stream().filter(ChoiceInput::correct).count() == 1));
        assertTrue(questions.stream().allMatch(question -> question.explanation().contains("đạo hàm")));
        assertTrue(questions.stream().map(NormalizedQuestion::stem).anyMatch(stem -> stem.contains("hàm số mũ")));
    }

    @Test
    void acceptsLatexBackslashesAndAnAnswerKey() {
        String raw = """
                {"questions":[{
                  "stem":"Tính đạo hàm của y = \\\\ln x tại x = e.",
                  "explanation":"Đạo hàm của \\\\ln x là 1/x, nên tại x = e giá trị bằng 1/e.",
                  "choices":[
                    {"key":"A","text":"1","correct":false},
                    {"key":"B","text":"1/e","correct":false},
                    {"key":"C","text":"e","correct":false},
                    {"key":"D","text":"0","correct":false}
                  ],
                  "correctText":"B"
                }]}
                """.replace("\\\\", "\\");

        List<NormalizedQuestion> questions = QuestionDraftParser.parse(
                raw, QuestionType.MULTIPLE_CHOICE, 4, 4, List.of());

        assertEquals(1, questions.size());
        assertEquals("B", questions.get(0).choices().stream()
                .filter(ChoiceInput::correct)
                .findFirst()
                .orElseThrow()
                .key());
        assertTrue(questions.get(0).explanation().contains("\\ln"));
    }

    private static String validItems() {
        StringBuilder builder = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            if (i > 1) {
                builder.append(',');
            }
            builder.append("""
                    {"stem":"Câu %d. Tính đạo hàm của hàm số mũ f_%d(x) = e^x + %d.","explanation":"Lời giải đạo hàm: đạo hàm của e^x là e^x, hằng số có đạo hàm bằng 0.","tags":["đạo hàm"],"choices":[
                      {"key":"A","text":"e^x","correct":true},
                      {"key":"B","text":"xe^x","correct":false},
                      {"key":"C","text":"%d","correct":false},
                      {"key":"D","text":"0","correct":false}
                    ]}
                    """.formatted(i, i, i, i));
        }
        return builder.toString();
    }
}
