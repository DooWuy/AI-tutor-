package com.vn.aitutor.repository.projection;

import java.util.UUID;

public interface SkillSummaryRow {
    UUID getLessonId();

    String getLessonCode();

    String getTitle();

    String getSubject();

    String getGradeLevel();

    Long getQuestionCount();
}
