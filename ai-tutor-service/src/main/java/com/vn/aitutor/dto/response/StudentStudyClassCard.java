package com.vn.aitutor.dto.response;

import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.StudyClassStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentStudyClassCard {
    private UUID enrollmentId;
    private EnrollmentStatus enrollmentStatus;
    private Instant requestedAt;
    private UUID classId;
    private String name;
    private String description;
    private String classCode;
    private StudyClassStatus classStatus;
    private String teacherName;
    private LocalDate startDate;
    private LocalDate endDate;
    private int maxStudents;
    private int approvedCount;
    private List<PublishedQuiz> quizzes;

    @Getter
    @Builder
    public static class PublishedQuiz {
        private UUID id;
        private String title;
        private String subject;
        private int questionCount;
        private int timeLimitMinutes;
    }
}
