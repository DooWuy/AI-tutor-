package com.vn.aitutor.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class QuestionUpsertRequest {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Size(min = 10, max = 2000, message = "Nội dung câu hỏi phải từ 10 đến 2000 ký tự")
    private String stem;

    @NotBlank(message = "Lời giải thích không được để trống")
    @Size(min = 10, max = 2000, message = "Lời giải thích phải từ 10 đến 2000 ký tự")
    private String explanation;

    @NotNull(message = "Độ khó không được để trống")
    @Min(value = 1, message = "Độ khó phải từ 1 đến 5")
    @Max(value = 5, message = "Độ khó phải từ 1 đến 5")
    private Integer difficulty;

    private String questionType;

    @Size(max = 10, message = "Tối đa 10 thẻ")
    private List<@Size(max = 50) String> tags = new ArrayList<>();

    @Valid
    private List<QuestionChoiceRequest> choices = new ArrayList<>();

    @Size(max = 500, message = "Đáp án điền từ tối đa 500 ký tự")
    private String correctText;
}
