package com.vn.aitutor.dto.response.classroom;

import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.StudyClassStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentStudyClassResponse {
    private UUID enrollmentId;
    private UUID classId;
    private String className;
    private String description;
    private String classCode;
    private String teacherName;
    private StudyClassStatus classStatus;
    private EnrollmentStatus enrollmentStatus;
    private Instant requestedAt;
    private Instant reviewedAt;
    private LocalDate startDate;
    private LocalDate endDate;
}
