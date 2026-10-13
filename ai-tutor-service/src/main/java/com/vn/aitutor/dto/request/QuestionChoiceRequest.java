package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QuestionChoiceRequest {

    @Size(max = 8)
    private String key;

    @NotBlank(message = "Nội dung phương án không được để trống")
    @Size(max = 1000, message = "Mỗi phương án tối đa 1000 ký tự")
    private String text;

    private boolean correct;
}
