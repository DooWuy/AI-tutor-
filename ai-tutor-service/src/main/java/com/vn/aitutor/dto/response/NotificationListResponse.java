package com.vn.aitutor.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationListResponse {
    private List<StudyNotificationResponse> items;
    private long unreadCount;
}
