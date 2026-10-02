package com.vn.aitutor.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChapterResponse {

    private UUID id;
    private UUID bookId;
    private String chapterCode;
    private String title;
    private int displayOrder;
    private List<LessonResponse> lessons;
}
