package com.vn.aitutor.dto.response.notification;

import java.util.List;

public record NotificationFeedResponse(List<NotificationResponse> items, String nextCursor, long unreadCount) {}
