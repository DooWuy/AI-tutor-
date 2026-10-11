package com.vn.aitutor.dto.response;

import com.vn.aitutor.entity.enums.QuestionType;
import java.util.*;

public record QuizContentResponse(UUID id, String title, String subject, int duration,
        List<Question> questions) {
    public record Question(UUID id, String questionText, QuestionType type,
            List<Map<String, Object>> options, int orderIndex) {}
}
