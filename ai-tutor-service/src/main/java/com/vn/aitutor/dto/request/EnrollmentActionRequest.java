package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EnrollmentActionRequest {

    @NotBlank(message = "Chọn chấp nhận hoặc từ chối")
    private String action;
}
