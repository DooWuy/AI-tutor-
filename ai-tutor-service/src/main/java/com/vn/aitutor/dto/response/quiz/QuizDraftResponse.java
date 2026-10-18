package com.vn.aitutor.dto.response.quiz;

import com.vn.aitutor.dto.request.quiz.QuizAnswerRequest;
import java.time.Instant;
import java.util.*;

public record QuizDraftResponse(UUID draftId, UUID quizId, Instant startedAt, Instant expiresAt,
        Instant serverTime, long answeredCount, List<QuizAnswerRequest> answers, UUID attemptId) {}
