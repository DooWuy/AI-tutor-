package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.SystemSettingsUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.SystemSettingResponse;
import com.vn.aitutor.service.ISystemSettingsService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class SystemSettingsController {

    private final ISystemSettingsService systemSettingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<SystemSettingResponse>>>> getSettings() {
        Map<String, List<SystemSettingResponse>> settings = systemSettingsService.getAllSettingsGrouped();
        return ResponseEntity.ok(ApiResponse.<Map<String, List<SystemSettingResponse>>>builder()
                .success(true)
                .message("Lấy cấu hình hệ thống thành công")
                .data(settings)
                .build());
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Void>> updateSettings(@Valid @RequestBody SystemSettingsUpdateRequest request) {
        systemSettingsService.updateSettings(request.getSettings());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Cập nhật cấu hình hệ thống thành công")
                .build());
    }
}
