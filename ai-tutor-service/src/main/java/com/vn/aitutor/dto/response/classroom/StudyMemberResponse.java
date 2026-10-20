package com.vn.aitutor.dto.response.classroom;

import com.vn.aitutor.entity.enums.EnrollmentStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyMemberResponse {
    private UUID id;
    private UUID studentId;
    private String fullName;
    private String email;
    private String studentCode;
    private EnrollmentStatus status;
    private Instant requestedAt;
}
