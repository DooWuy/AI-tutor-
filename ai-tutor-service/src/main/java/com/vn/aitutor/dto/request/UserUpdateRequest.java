package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import java.time.LocalDate;
import com.vn.aitutor.domain.enums.Gender;

@Data
public class UserUpdateRequest {
    @NotBlank(message = "Họ và tên không được để trống")
    @Pattern(regexp = "^(|[\\p{L}0-9]+( [\\p{L}0-9]+)*)$", message = "Họ và tên không hợp lệ. Chỉ được chứa chữ cái, số, khoảng trắng và không bắt đầu hoặc kết thúc bằng khoảng trắng.")
    private String fullName;

    private LocalDate dateOfBirth;
    private Gender gender;
    
    @Pattern(regexp = "^(|0[356789]\\d{8})$", message = "Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số và bắt đầu bằng '0'.")
    private String phoneNumber;
}
