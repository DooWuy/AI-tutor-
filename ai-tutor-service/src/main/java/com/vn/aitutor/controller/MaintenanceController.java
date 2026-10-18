package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.system.MaintenanceToggleRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.system.MaintenanceStatusResponse;
import com.vn.aitutor.service.system.ISystemSettingsService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/maintenance")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class MaintenanceController {

    private final ISystemSettingsService systemSettingsService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<MaintenanceStatusResponse>> getStatus() {
        boolean enabled = systemSettingsService.getBoolean("system.maintenance_mode", false);
        String message = systemSettingsService.getSetting(
                "system.maintenance_message",
                "Hệ thống đang được nâng cấp bảo trì định kỳ. Vui lòng quay lại sau ít phút!"
        );
        return ResponseEntity.ok(ApiResponse.<MaintenanceStatusResponse>builder()
                .success(true)
                .message("Lấy trạng thái bảo trì thành công")
                .data(MaintenanceStatusResponse.builder()
                        .enabled(enabled)
                        .message(message)
                        .build())
                .build());
    }

    @PostMapping("/toggle")
    public ResponseEntity<ApiResponse<MaintenanceStatusResponse>> toggle(
            @Valid @RequestBody MaintenanceToggleRequest request
    ) {
        String message = request.getMessage() != null && !request.getMessage().isBlank()
                ? request.getMessage().trim()
                : systemSettingsService.getSetting("system.maintenance_message", "Hệ thống đang được nâng cấp bảo trì định kỳ.");

        systemSettingsService.updateSettings(Map.of(
                "system.maintenance_mode", String.valueOf(request.getEnabled()),
                "system.maintenance_message", message
        ));

        return ResponseEntity.ok(ApiResponse.<MaintenanceStatusResponse>builder()
                .success(true)
                .message("Cập nhật chế độ bảo trì thành công: " + (request.getEnabled() ? "BẬT" : "TẮT"))
                .data(MaintenanceStatusResponse.builder()
                        .enabled(request.getEnabled())
                        .message(message)
                        .build())
                .build());
    }
}
