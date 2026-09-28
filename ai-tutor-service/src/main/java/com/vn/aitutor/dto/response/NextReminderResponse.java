package com.vn.aitutor.dto.response;

import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NextReminderResponse {
    private String subjectName;
    private Instant remindAt;
    private Instant lessonStartsAt;
    private String preview;
}
