package com.vn.aitutor.dto.request.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class StudyClassJoinRequest {

    @NotBlank(message = "Nhập mã lớp")
    @Size(max = 12, message = "Mã lớp gồm 6 ký tự")
    private String classCode;
}
