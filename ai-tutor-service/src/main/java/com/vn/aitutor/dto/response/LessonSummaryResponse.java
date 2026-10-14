package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonSummaryResponse {
    private UUID id;
    private String lessonCode;
    private String title;
    private String chapterTitle;
    private String bookTitle;
    private String subject;
    private String gradeLevel;
    private boolean assigned;
}
