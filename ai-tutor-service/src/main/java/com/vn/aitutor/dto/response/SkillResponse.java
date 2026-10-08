package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SkillResponse {
    private UUID id;
    private String skillCode;
    private String name;
    private String subject;
    private String gradeLevel;
    private long questionCount;
}
