package com.vn.aitutor.quiz;

import com.vn.aitutor.entity.enums.QuestionType;
import java.util.List;

public record NormalizedQuestion(
        String stem,
        String explanation,
        int difficulty,
        QuestionType type,
        List<String> tags,
        List<ChoiceInput> choices,
        String correctText) {
}
