package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChapterUpsertRequest {

    @NotBlank(message = "Mã chương không được để trống")
    @Size(max = 20, message = "Mã chương tối đa 20 ký tự")
    private String chapterCode;

    @NotBlank(message = "Tên chương không được để trống")
    @Size(min = 2, max = 150, message = "Tên chương phải dài từ 2 đến 150 ký tự")
    private String title;

    private Integer displayOrder;
}
