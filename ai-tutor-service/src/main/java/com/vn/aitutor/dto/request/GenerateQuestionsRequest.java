package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GenerateQuestionsRequest {

    @NotNull(message = "Độ khó không được để trống")
    @Min(value = 1, message = "Độ khó phải từ 1 đến 5")
    @Max(value = 5, message = "Độ khó phải từ 1 đến 5")
    private Integer difficulty;

    @NotNull(message = "Số lượng câu hỏi không được để trống")
    @Min(value = 1, message = "Số lượng câu hỏi phải từ 1 đến 20")
    @Max(value = 20, message = "Số lượng câu hỏi phải từ 1 đến 20")
    private Integer count = 1;

    private String questionType = "MULTIPLE_CHOICE";
}
