package com.vn.aitutor.dto.request.quiz;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;

public record QuizDraftRequest(@NotNull UUID quizId, UUID draftId,
        @NotNull @Size(max = 100) List<@NotNull @Valid QuizAnswerRequest> answers) {}
