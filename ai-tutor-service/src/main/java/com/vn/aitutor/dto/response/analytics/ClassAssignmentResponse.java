package com.vn.aitutor.dto.response.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClassAssignmentResponse {
    private UUID id;
    private UUID classId;
    private UUID teacherId;
    private String subject;
    @JsonProperty("isHomeroom")
    private boolean homeroom;
}
