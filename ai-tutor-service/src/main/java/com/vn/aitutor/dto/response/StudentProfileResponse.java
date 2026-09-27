package com.vn.aitutor.dto.response;

import com.vn.aitutor.entity.enums.Gender;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StudentProfileResponse {
    UUID userId;
    UUID studentId;
    String studentCode;
    String username;
    String email;
    String fullName;
    LocalDate dateOfBirth;
    Gender gender;
    String phoneNumber;
    String avatarUrl;
    String gradeLevel;
    String className;
    String schoolName;
    Map<String, Object> studyPreferences;
    int totalXp;
    int currentLevel;
    int currentStreak;
}
