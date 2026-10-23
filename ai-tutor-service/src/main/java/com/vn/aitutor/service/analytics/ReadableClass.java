package com.vn.aitutor.service.analytics;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.StudyClass;
import java.util.UUID;

public record ReadableClass(UUID id, String name, String gradeLevel, String schoolName, boolean studyClass) {

    public static ReadableClass of(SchoolClass schoolClass) {
        return new ReadableClass(
                schoolClass.getId(),
                schoolClass.getName(),
                schoolClass.getGradeLevel(),
                schoolClass.getSchoolName(),
                false);
    }

    public static ReadableClass study(StudyClass studyClass) {
        return new ReadableClass(studyClass.getId(), studyClass.getName(), "Lớp học thêm", null, true);
    }
}
