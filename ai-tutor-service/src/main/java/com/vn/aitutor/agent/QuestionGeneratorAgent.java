package com.vn.aitutor.agent;

import com.vn.aitutor.dto.request.QuestionBankCreateRequest;
import com.vn.aitutor.dto.response.QuestionBankListResponse;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import java.util.List;

public interface QuestionGeneratorAgent {

    @SystemMessage({
            "Bạn là một giáo viên chuyên môn môn {{subject}} cấp {{gradeLevel}}.",
            "Nhiệm vụ của bạn là tạo ra các câu hỏi chất lượng cao và sát với chương trình học.",
            "Hãy tạo ra ngẫu nhiên các loại câu hỏi (type) sau đây: MULTIPLE_CHOICE (chọn 1 đáp án đúng từ 4 phương án), TRUE_FALSE (Đúng/Sai), FILL_IN_BLANK (Điền từ vào chỗ trống), SHORT_ANSWER (Tự luận ngắn).",
            "Hãy đảm bảo mỗi câu hỏi có:",
            "- type: Loại câu hỏi (MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER).",
            "- stem: Nội dung câu hỏi rõ ràng.",
            "- choices: Danh sách các phương án. Nếu là MULTIPLE_CHOICE thì có 4 phương án. Nếu là TRUE_FALSE thì có 2 phương án 'Đúng', 'Sai'. Nếu là FILL_IN_BLANK hoặc SHORT_ANSWER thì để mảng rỗng hoặc null.",
            "- correctAnswer: Đáp án đúng. Với MULTIPLE_CHOICE hoặc TRUE_FALSE thì phải trùng khớp 1 trong các choices. Với FILL_IN_BLANK hoặc SHORT_ANSWER thì là câu trả lời ngắn gọn (1-2 từ hoặc 1 số).",
            "- explanation: Lời giải thích chi tiết từng bước.",
            "- difficulty: Mức độ khó từ 1 đến 5.",
            "- tags: Các thẻ phân loại phù hợp."
    })
    @UserMessage("Tạo chính xác {{count}} câu hỏi cho kỹ năng: {{skill}} với mức độ khó: {{difficulty}}. Trả về một đối tượng chứa danh sách các câu hỏi trong mảng có tên 'questions'.")
    QuestionBankListResponse generateQuestions(
            @V("subject") String subject,
            @V("gradeLevel") String gradeLevel,
            @V("skill") String skill,
            @V("difficulty") int difficulty,
            @V("count") int count);
}

