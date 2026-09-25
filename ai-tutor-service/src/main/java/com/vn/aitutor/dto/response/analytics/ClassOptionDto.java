package com.vn.aitutor.dto.response.analytics;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClassOptionDto {
    private UUID id;
    private String name;
    private String gradeLevel;
    @JsonProperty("isHomeroom")
    private boolean homeroom;
}
