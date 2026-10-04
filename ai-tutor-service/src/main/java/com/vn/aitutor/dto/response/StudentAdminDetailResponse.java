package com.vn.aitutor.dto.response;

import java.util.Map;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StudentAdminDetailResponse {
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
    int longestStreak;
    String address;
    Map<String, Object> studyPreferences;
    String parentName;
    String parentEmail;
    String parentPhone;
    long quizAttemptCount;
    BigDecimal averageScore;
    Instant lastQuizSubmittedAt;
    long chatSessionCount;
    long scheduleCount;
}
