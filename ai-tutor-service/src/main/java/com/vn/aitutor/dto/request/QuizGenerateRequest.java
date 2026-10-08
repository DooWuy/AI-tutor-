package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QuizGenerateRequest {

    @NotBlank(message = "Chủ đề không được để trống")
    @Size(max = 200, message = "Chủ đề tối đa 200 ký tự")
    private String topic;

    @NotNull(message = "Số lượng câu hỏi không được để trống")
    @Min(value = 1, message = "Số lượng câu hỏi phải từ 1 đến 20")
    @Max(value = 20, message = "Số lượng câu hỏi phải từ 1 đến 20")
    private Integer count;

    @NotNull(message = "Độ khó tối thiểu không được để trống")
    @Min(value = 1, message = "Độ khó phải từ 1 đến 5")
    @Max(value = 5, message = "Độ khó phải từ 1 đến 5")
    private Integer minDifficulty;

    @NotNull(message = "Độ khó tối đa không được để trống")
    @Min(value = 1, message = "Độ khó phải từ 1 đến 5")
    @Max(value = 5, message = "Độ khó phải từ 1 đến 5")
    private Integer maxDifficulty;

    @NotNull(message = "Số câu trắc nghiệm không được để trống")
    @Min(value = 0, message = "Số câu trắc nghiệm không được âm")
    private Integer multipleChoice;

    @NotNull(message = "Số câu đúng/sai không được để trống")
    @Min(value = 0, message = "Số câu đúng/sai không được âm")
    private Integer trueFalse;

    @NotNull(message = "Số câu điền từ không được để trống")
    @Min(value = 0, message = "Số câu điền từ không được âm")
    private Integer fillBlank;
}
