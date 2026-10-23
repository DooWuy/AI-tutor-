package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.notification.NotificationResponse;
import com.vn.aitutor.dto.response.notification.NotificationFeedResponse;
import com.vn.aitutor.dto.response.notification.NotificationUnreadCountResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.system.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "limit", required = false) Integer limit) {
        List<NotificationResponse> notifications = notificationService.getMyNotifications(principal.getUsers().getId(), limit);
        return ResponseEntity.ok(ApiResponse.<List<NotificationResponse>>builder()
                .success(true)
                .message("Lấy thông báo thành công")
                .data(notifications)
                .build());
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<NotificationFeedResponse>> getFeed(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly) {
        return ResponseEntity.ok(ApiResponse.<NotificationFeedResponse>builder().success(true)
                .message("Lấy thông báo thành công")
                .data(notificationService.getFeed(principal.getUsers().getId(), cursor, size, unreadOnly)).build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<NotificationUnreadCountResponse>> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.<NotificationUnreadCountResponse>builder().success(true)
                .data(new NotificationUnreadCountResponse(notificationService.getUnreadCount(principal.getUsers().getId()))).build());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        notificationService.markAsRead(id, principal.getUsers().getId());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã đọc")
                .build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getUsers().getId());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã đọc tất cả")
                .build());
    }
}
