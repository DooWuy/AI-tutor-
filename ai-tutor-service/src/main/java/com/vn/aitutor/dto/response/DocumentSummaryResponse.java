package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DocumentSummaryResponse {

    private UUID id;
    private String title;
    private String fileName;
    private String subject;
    private String gradeLevel;
    private String status;
    private int progressPercentage;
    private String documentType;
    private UUID lessonId;
    private String errorMessage;
    private Instant createdAt;
}
