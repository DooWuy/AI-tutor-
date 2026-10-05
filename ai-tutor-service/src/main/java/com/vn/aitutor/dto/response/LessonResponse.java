package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LessonResponse {

    private UUID id;
    private UUID chapterId;
    private String lessonCode;
    private String title;
    private int displayOrder;
}
