package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.entity.Notification;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.NotificationService;
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
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        List<Notification> notifications = notificationService.getMyNotifications(principal.getUsers().getId());
        return ResponseEntity.ok(ApiResponse.<List<Notification>>builder()
                .success(true)
                .message("Lấy thông báo thành công")
                .data(notifications)
                .build());
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
