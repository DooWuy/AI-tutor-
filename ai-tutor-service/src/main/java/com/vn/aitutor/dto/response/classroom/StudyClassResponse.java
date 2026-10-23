package com.vn.aitutor.dto.response.classroom;

import com.vn.aitutor.entity.enums.StudyClassStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyClassResponse {
    private UUID id;
    private String name;
    private String description;
    private String classCode;
    private StudyClassStatus status;
    private int maxStudents;
    private int approvedCount;
    private int pendingCount;
    private LocalDate startDate;
    private LocalDate endDate;
    private Instant createdAt;
    private List<StudyMemberResponse> members;
}
