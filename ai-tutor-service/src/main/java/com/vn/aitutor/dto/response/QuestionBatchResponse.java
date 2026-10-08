package com.vn.aitutor.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuestionBatchResponse {
    private UUID batchId;
    private String warning;
    private List<QuestionResponse> questions;
}
