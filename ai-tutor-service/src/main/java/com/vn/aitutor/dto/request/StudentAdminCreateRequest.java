package com.vn.aitutor.dto.request;

import com.vn.aitutor.entity.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Data;

@Data
public class StudentAdminCreateRequest {
    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9_]+$")
    private String username;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+=-]).{8,}$")
    private String password;

    @NotBlank
    @Size(max = 255)
    private String fullName;

    @NotBlank
    @Size(max = 255)
    private String schoolName;

    @NotBlank
    @Size(max = 32)
    private String gradeLevel;

    @Size(max = 64)
    private String className;

    @Pattern(regexp = "^(|0[356789]\\d{8})$")
    private String phoneNumber;

    @PastOrPresent
    private LocalDate dateOfBirth;

    private Gender gender;
}
