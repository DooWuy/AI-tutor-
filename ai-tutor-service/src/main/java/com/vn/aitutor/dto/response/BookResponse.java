package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BookResponse {

    private UUID id;
    private String title;
    private String subject;
    private String gradeLevel;
    private String curriculumName;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ChapterResponse> chapters;
}
