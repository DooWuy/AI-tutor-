package com.vn.aitutor.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TeacherClassResponse {
    private UUID id;
    private String name;
    private String gradeLevel;
    private String schoolName;
    private String academicYear;
    private String subject;
    @JsonProperty("isHomeroom")
    private boolean homeroom;
    private int studentCount;
}
