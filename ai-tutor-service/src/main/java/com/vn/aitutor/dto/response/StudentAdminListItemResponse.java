package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StudentAdminListItemResponse {
    UUID studentId;
    UUID userId;
    String studentCode;
    String username;
    String email;
    String fullName;
    String phoneNumber;
    String avatarUrl;
    String gender;
    LocalDate dateOfBirth;
    String schoolName;
    String gradeLevel;
    UUID classId;
    String className;
    int totalXp;
    int currentLevel;
    int currentStreak;
    Instant lastActivityDate;
    boolean active;
    Instant createdAt;
    Instant updatedAt;
}
