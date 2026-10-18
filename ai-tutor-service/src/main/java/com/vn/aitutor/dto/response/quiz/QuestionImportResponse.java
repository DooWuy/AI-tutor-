package com.vn.aitutor.dto.response.quiz;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuestionImportResponse {
    private int imported;
    private int failed;
    private List<RowError> errors;

    @Getter
    @Builder
    public static class RowError {
        private int row;
        private String message;
    }
}
