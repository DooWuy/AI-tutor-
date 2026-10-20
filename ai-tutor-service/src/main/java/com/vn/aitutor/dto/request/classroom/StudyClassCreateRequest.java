package com.vn.aitutor.dto.request.classroom;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Data;

@Data
public class StudyClassCreateRequest {

    @NotBlank(message = "Nhập tên lớp")
    @Size(max = 64, message = "Tên lớp tối đa 64 ký tự")
    private String name;

    @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
    private String description;

    @Min(value = 1, message = "Sĩ số tối đa từ 1 đến 200")
    @Max(value = 200, message = "Sĩ số tối đa từ 1 đến 200")
    private Integer maxStudents;

    private LocalDate endDate;

    @Min(value = 1, message = "Thời hạn phải lớn hơn 0")
    @Max(value = 104, message = "Thời hạn tối đa 104 tuần hoặc 24 tháng")
    private Integer durationAmount;

    private String durationUnit;
}
