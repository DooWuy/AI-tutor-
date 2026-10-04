package com.vn.aitutor.dto.request;

import com.vn.aitutor.entity.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Map;
import lombok.Data;

@Data
public class StudentAdminUpdateRequest {
    @jakarta.validation.constraints.NotBlank
    @Size(max = 255)
    private String fullName;

    @PastOrPresent
    private LocalDate dateOfBirth;
    private Gender gender;

    @Pattern(regexp = "^(|0[356789]\\d{8})$")
    private String phoneNumber;

    @Size(max = 255)
    private String schoolName;
    @Size(max = 32)
    private String gradeLevel;
    @Size(max = 64)
    private String className;
    private String address;
    private String parentName;
    @Email
    private String parentEmail;
    private String parentPhone;
    private Map<String, Object> studyPreferences;
}
