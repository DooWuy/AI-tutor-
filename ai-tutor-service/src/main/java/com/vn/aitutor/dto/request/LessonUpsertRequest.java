package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LessonUpsertRequest {

    @NotBlank(message = "Mã bài học không được để trống")
    @Size(max = 20, message = "Mã bài học tối đa 20 ký tự")
    private String lessonCode;

    @NotBlank(message = "Tiêu đề bài học không được để trống")
    @Size(min = 2, max = 150, message = "Tiêu đề bài học phải dài từ 2 đến 150 ký tự")
    private String title;

    private Integer displayOrder;
}
