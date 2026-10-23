package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.dto.response.notification.NotificationResponse;

public record NotificationCreationResult(NotificationResponse notification, boolean created) {}
