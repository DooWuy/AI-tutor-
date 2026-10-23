package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentSchoolClassCard {
    private UUID id;
    private String name;
    private String gradeLevel;
    private String schoolName;
    private String academicYear;
}
