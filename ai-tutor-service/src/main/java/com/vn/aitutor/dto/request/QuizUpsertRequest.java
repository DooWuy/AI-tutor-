package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class QuizUpsertRequest {

    @NotBlank(message = "Tiêu đề đề thi không được để trống")
    @Size(min = 3, max = 200, message = "Tiêu đề đề thi phải từ 3 đến 200 ký tự")
    private String title;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;

    @NotBlank(message = "Môn học không được để trống")
    private String subject;

    @NotBlank(message = "Khối lớp không được để trống")
    private String gradeLevel;

    private UUID lessonId;

    @NotNull(message = "Thời gian làm bài không được để trống")
    @Min(value = 1, message = "Thời gian làm bài phải từ 1 đến 180 phút")
    @Max(value = 180, message = "Thời gian làm bài phải từ 1 đến 180 phút")
    private Integer timeLimitMinutes = 30;

    @NotNull(message = "Số lượt làm bài không được để trống")
    @Min(value = 1, message = "Số lượt làm bài phải từ 1 đến 10")
    @Max(value = 10, message = "Số lượt làm bài phải từ 1 đến 10")
    private Integer maxAttempts = 3;

    @NotNull(message = "Điểm đạt yêu cầu không được để trống")
    @DecimalMin(value = "0.0", message = "Điểm đạt yêu cầu phải từ 0 đến 100")
    @DecimalMax(value = "100.0", message = "Điểm đạt yêu cầu phải từ 0 đến 100")
    private BigDecimal passingScore = new BigDecimal("70.0");
}
