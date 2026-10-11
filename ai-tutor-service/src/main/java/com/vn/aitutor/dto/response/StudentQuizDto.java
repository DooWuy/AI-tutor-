package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentQuizDto {
    private UUID id;
    private String title;
    private int duration;
    private int questionCount;
    private String status;
}

