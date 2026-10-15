package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class QuizClassRef {
    private UUID id;
    private String name;
    private String gradeLevel;
}
