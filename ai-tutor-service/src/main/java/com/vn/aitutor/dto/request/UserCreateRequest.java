package com.vn.aitutor.dto.request;

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
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = "^(|(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+=-]).{8,})$", message = "Mật khẩu phải dài ít nhất 8 ký tự và bao gồm ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt")
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    @Pattern(regexp = "^(|[\\p{L}0-9]+( [\\p{L}0-9]+)*)$", message = "Họ và tên không hợp lệ. Chỉ được chứa chữ cái, số, khoảng trắng và không bắt đầu hoặc kết thúc bằng khoảng trắng.")
    private String fullName;

    @NotNull(message = "Vai trò không được để trống")
    private Role role;
}
