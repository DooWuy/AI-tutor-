package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;
import com.vn.aitutor.entity.enums.Gender;

@Data
public class RegisterRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Pattern(regexp = "^(|[a-zA-Z0-9_]+)$", message = "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Pattern(regexp = "^(|(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+=-]).{8,})$", message = "Mật khẩu phải dài ít nhất 8 ký tự và bao gồm ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt")
    private String password;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;

    @NotBlank(message = "Họ và tên không được để trống")
    @Pattern(regexp = "^(|[\\p{L}0-9]+( [\\p{L}0-9]+)*)$", message = "Họ và tên không hợp lệ. Chỉ được chứa chữ cái, số, khoảng trắng và không bắt đầu hoặc kết thúc bằng khoảng trắng.")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    private LocalDate dateOfBirth;

    private Gender gender;

    @NotBlank(message = "Tên trường học không được để trống")
    private String schoolName;

    @NotBlank(message = "Khối lớp không được để trống")
    @Pattern(regexp = "^([1-9]|1[0-2])$", message = "Khối lớp phải từ 1 đến 12")
    private String gradeLevel;

    @NotBlank(message = "Tên lớp không được để trống")
    private String className;
}
