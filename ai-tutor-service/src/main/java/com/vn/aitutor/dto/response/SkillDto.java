package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.Data;

@Data
public class SkillDto {
    private UUID id;
    private String name;
    private String code;
    private String subject;
    private String gradeLevel;
    private String description;
}

