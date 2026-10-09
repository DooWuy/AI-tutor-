package com.vn.aitutor.service;

import com.vn.aitutor.entity.enums.GenerationJobKind;
import java.util.UUID;

public record GenerationWork(
        UUID jobId,
        GenerationJobKind kind,
        UUID lessonId,
        UUID quizId,
        UUID userId,
        Integer difficulty,
        Integer questionCount,
        String questionType,
        String topic,
        Integer minDifficulty,
        Integer maxDifficulty,
        Integer multipleChoice,
        Integer trueFalse,
        Integer fillBlank) {
}
