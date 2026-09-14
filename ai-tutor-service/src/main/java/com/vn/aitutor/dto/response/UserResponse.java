package com.vn.aitutor.dto.response;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {
    private UUID userId;
    private String username;
    private String fullName;
    private String phoneNumber;
    private String email;
    private String role;
    private String gender;
    private LocalDate dateOfBirth;
    private String avatarUrl;
    private Boolean active;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean isDeleted;
}