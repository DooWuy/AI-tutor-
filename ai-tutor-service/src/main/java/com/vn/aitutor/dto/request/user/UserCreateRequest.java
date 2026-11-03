package com.vn.aitutor.dto.request.user;

import com.vn.aitutor.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UserCreateRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Pattern(regexp = "^(|[a-zA-Z0-9_]+)$", message = "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới")
    @jakarta.validation.constraints.Size(max = 255)
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @jakarta.validation.constraints.Size(max = 255)
    private String email;

    @Pattern(regexp = "^(|(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+=-]).{8,})$", message = "Mật khẩu phải dài ít nhất 8 ký tự và bao gồm ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt")
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    @Pattern(regexp = "^(|[\\p{L}0-9]+( [\\p{L}0-9]+)*)$", message = "Họ và tên không hợp lệ. Chỉ được chứa chữ cái, số, khoảng trắng và không bắt đầu hoặc kết thúc bằng khoảng trắng.")
    @jakarta.validation.constraints.Size(max = 255)
    private String fullName;

    @NotNull(message = "Vai trò không được để trống")
    private Role role;

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
