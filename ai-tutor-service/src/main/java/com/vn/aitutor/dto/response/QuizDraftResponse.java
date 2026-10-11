package com.vn.aitutor.dto.response;

import com.vn.aitutor.dto.request.QuizAnswerRequest;
import java.time.Instant;
import java.util.*;

public record QuizDraftResponse(UUID draftId, UUID quizId, Instant startedAt, Instant expiresAt,
        Instant serverTime, long answeredCount, List<QuizAnswerRequest> answers, UUID attemptId) {}
