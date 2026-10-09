package com.vn.aitutor.service;

import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.exception.ServiceUnavailableException;
import com.vn.aitutor.quiz.NormalizedQuestion;
import com.vn.aitutor.quiz.QuestionContentRules;
import com.vn.aitutor.quiz.QuestionDraftParser;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QuestionComposer {

    private static final int BATCH = 5;

    private final GeminiQuestionClient geminiQuestionClient;

    public List<NormalizedQuestion> compose(ComposeRequest request) {
        QuestionContentRules.requireGenerateCount(request.count());
        QuestionContentRules.requireDifficulty(request.difficulty());
        List<NormalizedQuestion> accepted = new ArrayList<>();
        List<String> stems = new ArrayList<>();
        int round = 0;
        int maxRounds = Math.max(4, ((request.count() + BATCH - 1) / BATCH) * 2);
        while (accepted.size() < request.count() && round < maxRounds) {
            int need = Math.min(BATCH, request.count() - accepted.size());
            String raw = geminiQuestionClient.complete(prompt(request, need, stems));
            List<NormalizedQuestion> parsed = QuestionDraftParser.parse(
                    raw, request.type(), request.difficulty(), request.exactChoiceCount(), stems);
            for (NormalizedQuestion question : parsed) {
                if (accepted.size() == request.count()) {
                    break;
                }
                accepted.add(question);
                stems.add(question.stem());
            }
            round++;
        }
        if (accepted.size() < request.count()) {
            throw new ServiceUnavailableException("AI chưa soạn đủ câu hỏi hợp lệ. Hãy thử lại.");
        }
        return accepted;
    }

    private String prompt(ComposeRequest request, int need, List<String> existingStems) {
        String typeGuide = switch (request.type()) {
            case TRUE_FALSE -> "đúng/sai với đúng 2 phương án, một phương án đúng";
            case FILL_BLANK -> "điền từ, trường correctText là đáp án ngắn, choices để mảng rỗng";
            case MULTIPLE_CHOICE -> "trắc nghiệm với đúng " + request.exactChoiceCount() + " phương án, một phương án đúng";
        };
        String avoid = existingStems.isEmpty()
                ? ""
                : "\nKhông được trùng các câu đã có:\n- " + String.join("\n- ", existingStems);
        String context = request.context() == null || request.context().isBlank()
                ? "Chưa có tài liệu nguồn. Soạn theo tên kỹ năng và chủ đề."
                : request.context();
        return """
                Bạn là giáo viên soạn câu hỏi tiếng Việt cho học sinh.
                Kỹ năng: %s
                Môn: %s. Khối: %s. Độ khó %d trên thang 1 (dễ) đến 5 (rất khó).
                Chủ đề thêm: %s
                Hãy tạo đúng %d câu %s.
                Mỗi câu có stem, explanation (lời giải từng bước bằng tiếng Việt, 10-2000 ký tự), tags.
                Mọi công thức trong stem, choices.text, correctText và explanation phải viết trong $...$ hoặc $$...$$, kể cả phân số và ký hiệu.
                Chỉ trả JSON theo dạng {"questions":[{"stem":"","explanation":"","tags":[],"choices":[{"key":"A","text":"","correct":false}],"correctText":""}]}.
                Tài liệu nguồn:
                %s
                %s
                """.formatted(
                request.skillName(),
                request.subjectLabel(),
                request.gradeLevel(),
                request.difficulty(),
                request.topic() == null ? "" : request.topic(),
                need,
                typeGuide,
                context,
                avoid);
    }

    public record ComposeRequest(
            String skillName,
            String subjectLabel,
            String gradeLevel,
            String topic,
            String context,
            int difficulty,
            int count,
            QuestionType type,
            int exactChoiceCount) {
    }
}
