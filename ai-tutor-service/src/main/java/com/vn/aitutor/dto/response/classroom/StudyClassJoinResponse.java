package com.vn.aitutor.dto.response.classroom;

import com.vn.aitutor.entity.enums.EnrollmentStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyClassJoinResponse {
    private String className;
    private String classCode;
    private EnrollmentStatus status;
}
