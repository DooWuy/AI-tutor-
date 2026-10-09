package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record QuizAnswerRequest(@NotNull UUID questionId, @Size(max = 200) String value) {}
