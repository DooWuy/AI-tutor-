package com.vn.aitutor.dto.response;

import com.vn.aitutor.notification.StudyNotificationPayload;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyNotificationResponse {
    private UUID id;
    private String title;
    private String body;
    private String deepLink;
    private String subjectName;
    private Instant lessonStartsAt;
    private Instant createdAt;
    private boolean read;
    private StudyNotificationPayload payload;
}
