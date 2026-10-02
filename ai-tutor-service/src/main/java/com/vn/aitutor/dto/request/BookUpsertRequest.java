package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BookUpsertRequest {

    @NotBlank(message = "Tên sách không được để trống")
    @Size(min = 2, max = 100, message = "Tên sách phải dài từ 2 đến 100 ký tự")
    private String title;

    @NotBlank(message = "Môn học không được để trống")
    private String subject;

    @NotBlank(message = "Khối lớp không được để trống")
    private String gradeLevel;

    @NotBlank(message = "Chương trình học không được để trống")
    @Size(min = 2, max = 50, message = "Chương trình học phải dài từ 2 đến 50 ký tự")
    private String curriculumName;
}
