package com.vn.aitutor.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GenerationJobResponse {
    private UUID id;
    private String kind;
    private String status;
    private UUID lessonId;
    private UUID quizId;
    private UUID batchId;
    private String message;
    private List<QuestionResponse> questions;
}
