package com.vn.aitutor.dto.request.curriculum;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillUpdateRequest {

    @NotBlank(message = "Mã kỹ năng không được để trống")
    @Pattern(regexp = "^[A-Za-z0-9_]{2,20}$", message = "Mã kỹ năng phải từ 2-20 ký tự, gồm chữ cái, chữ số hoặc gạch dưới")
    private String code;

    @NotBlank(message = "Tên kỹ năng không được để trống")
    @Size(min = 2, max = 100, message = "Tên kỹ năng phải từ 2-100 ký tự")
    private String name;

    private String subject;

    private String gradeLevel;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    @NotNull(message = "Độ quan trọng không được để trống")
    @Min(value = 1, message = "Độ quan trọng tối thiểu là 1")
    @Max(value = 10, message = "Độ quan trọng tối đa là 10")
    private Integer importance;

    @NotNull(message = "Ngưỡng thành thạo không được để trống")
    @DecimalMin(value = "0.00", message = "Ngưỡng thành thạo tối thiểu là 0.00")
    @DecimalMax(value = "1.00", message = "Ngưỡng thành thạo tối đa là 1.00")
    private BigDecimal masteryThreshold;

    @NotNull(message = "Số lượt làm tối thiểu không được để trống")
    @Min(value = 1, message = "Số lượt làm tối thiểu là 1")
    @Max(value = 100, message = "Số lượt làm tối đa là 100")
    private Integer minAttempts;

    @NotNull(message = "Cho phép bỏ qua không được để trống")
    private Boolean canSkip;
}
