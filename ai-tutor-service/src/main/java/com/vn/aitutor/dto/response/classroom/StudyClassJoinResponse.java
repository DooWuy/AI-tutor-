package com.vn.aitutor.dto.response.classroom;

import com.vn.aitutor.entity.enums.EnrollmentStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyClassJoinResponse {
    private UUID enrollmentId;
    private UUID classId;
    private String className;
    private String classCode;
    private EnrollmentStatus status;
    private Instant requestedAt;
}
