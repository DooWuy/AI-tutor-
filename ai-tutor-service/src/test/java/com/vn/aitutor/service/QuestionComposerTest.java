package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.quiz.NormalizedQuestion;
import com.vn.aitutor.service.QuestionComposer.ComposeRequest;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuestionComposerTest {

    @Mock
    private GeminiQuestionClient geminiQuestionClient;
    @InjectMocks
    private QuestionComposer questionComposer;

    @Test
    void generatesFiveMultipleChoiceQuestionsAtTheRequestedDifficulty() {
        when(geminiQuestionClient.complete(anyString())).thenReturn(payload());

        List<NormalizedQuestion> questions = questionComposer.compose(new ComposeRequest(
                "Tính đạo hàm hàm số mũ",
                "Toán",
                "12",
                "Đạo hàm",
                "Đạo hàm của e^x là e^x.",
                4,
                5,
                QuestionType.MULTIPLE_CHOICE,
                4));

        assertEquals(5, questions.size());
        assertTrue(questions.stream().allMatch(question -> question.difficulty() == 4));
        assertTrue(questions.stream().allMatch(question -> question.choices().size() == 4));
        assertTrue(questions.stream().allMatch(question -> question.explanation().contains("đạo hàm")));
    }

    private static String payload() {
        StringBuilder builder = new StringBuilder("{\"questions\":[");
        for (int i = 1; i <= 5; i++) {
            if (i > 1) {
                builder.append(',');
            }
            builder.append("""
                    {"stem":"Câu %d về đạo hàm hàm số mũ e^x cộng %d có kết quả nào?","explanation":"Lời giải đạo hàm: (e^x)' = e^x, nên kết quả vẫn là e^x.","tags":["đạo hàm"],"choices":[
                      {"key":"A","text":"e^x","correct":true},
                      {"key":"B","text":"x","correct":false},
                      {"key":"C","text":"%d e^x","correct":false},
                      {"key":"D","text":"0","correct":false}
                    ]}
                    """.formatted(i, i, i));
        }
        builder.append("]}");
        return builder.toString();
    }
}
