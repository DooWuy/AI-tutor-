package com.vn.aitutor.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDate;
import com.vn.aitutor.entity.enums.Gender;

@Data
public class UserUpdateRequest {
    @com.fasterxml.jackson.annotation.JsonAnySetter
    public void rejectUnknown(String field, Object value) {
        throw new IllegalArgumentException("Trường không được phép: " + field);
    }

    @NotBlank(message = "Họ và tên không được để trống")
    @Pattern(regexp = "^(|[\\p{L}0-9]+( [\\p{L}0-9]+)*)$", message = "Họ và tên không hợp lệ. Chỉ được chứa chữ cái, số, khoảng trắng và không bắt đầu hoặc kết thúc bằng khoảng trắng.")
    @jakarta.validation.constraints.Size(max = 255)
    private String fullName;

    @jakarta.validation.constraints.Past
    private LocalDate dateOfBirth;
    private Gender gender;
    
    @Pattern(regexp = "^(|0[356789]\\d{8})$", message = "Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số và bắt đầu bằng '0'.")
    private String phoneNumber;

    // Optional fields for Student Profile
    private String gradeLevel;
    private String className;
    @jakarta.validation.constraints.Size(max = 255)
    private String schoolName;

    // Optional fields for Teacher Profile
    @jakarta.validation.constraints.Size(max = 128)
    private String department;
    @jakarta.validation.constraints.Size(max = 128)
    private String subjectTaught;
}
