package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.ScanReminderRequest;
import com.vn.aitutor.dto.request.UpdateReminderPreferenceRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.NotificationListResponse;
import com.vn.aitutor.dto.response.ReminderPreferenceResponse;
import com.vn.aitutor.dto.response.StudyNotificationResponse;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.impl.StudyNotificationService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_STUDENT')")
public class NotificationController {

    private final StudyNotificationService studyNotificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<NotificationListResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "20") int limit
    ) {
        if (limit < 1 || limit > 50) {
            throw new ResourceBadRequestException("limit phải từ 1 đến 50");
        }
        return ResponseEntity.ok(ApiResponse.<NotificationListResponse>builder()
                .success(true)
                .message("Lấy thông báo thành công")
                .data(studyNotificationService.list(principal.getUsers().getId(), limit))
                .build());
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<ReminderPreferenceResponse>> preferences(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.<ReminderPreferenceResponse>builder()
                .success(true)
                .message("Lấy cài đặt nhắc lịch thành công")
                .data(studyNotificationService.preferences(principal.getUsers().getId()))
                .build());
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<ReminderPreferenceResponse>> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateReminderPreferenceRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.<ReminderPreferenceResponse>builder()
                .success(true)
                .message("Đã lưu cài đặt nhắc lịch")
                .data(studyNotificationService.updatePreferences(principal.getUsers().getId(), request.getEnabled()))
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudyNotificationResponse>> get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.<StudyNotificationResponse>builder()
                .success(true)
                .message("Lấy thông báo thành công")
                .data(studyNotificationService.get(principal.getUsers().getId(), id))
                .build());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<StudyNotificationResponse>> markRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.<StudyNotificationResponse>builder()
                .success(true)
                .message("Đã đánh dấu đã đọc")
                .data(studyNotificationService.markRead(principal.getUsers().getId(), id))
                .build());
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        studyNotificationService.markAllRead(principal.getUsers().getId());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã đánh dấu tất cả đã đọc")
                .build());
    }

    @PostMapping("/scan-me")
    public ResponseEntity<ApiResponse<Integer>> scanMe(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) ScanReminderRequest request
    ) {
        int created = studyNotificationService.scanCurrentStudent(principal.getUsers().getId(), request);
        return ResponseEntity.ok(ApiResponse.<Integer>builder()
                .success(true)
                .message("Đã quét nhắc lịch")
                .data(created)
                .build());
    }
}
