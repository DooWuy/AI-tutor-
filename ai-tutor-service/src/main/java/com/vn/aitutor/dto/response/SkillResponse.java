package com.vn.aitutor.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillResponse {
    private UUID id;
    private String skillCode;
    private String name;
    private String subject;
    private String gradeLevel;
    private String description;
    private Integer importance;
    private BigDecimal masteryThreshold;
    private Integer minAttempts;
    private Boolean canSkip;
    private long questionCount;
    private long assignedLessonCount;
    private Instant createdAt;
    private Instant updatedAt;
}
