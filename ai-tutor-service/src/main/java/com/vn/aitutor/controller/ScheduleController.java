package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.ScheduleCreateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.OcrExtractionResponse;
import com.vn.aitutor.dto.response.ScheduleResponse;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final IScheduleService scheduleService;

    @PostMapping("/extract-ocr")
    public ResponseEntity<ApiResponse<OcrExtractionResponse>> extractScheduleFromImage(
            @RequestParam("file") MultipartFile file) throws Exception {
        
        OcrExtractionResponse response = scheduleService.extractScheduleFromImage(file);
        
        return ResponseEntity.ok(ApiResponse.<OcrExtractionResponse>builder()
                .success(true)
                .message("Trích xuất thời khóa biểu thành công")
                .data(response)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ScheduleResponse>> createSchedule(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody ScheduleCreateRequest request) {
        
        ScheduleResponse response = scheduleService.createSchedule(userPrincipal.getUsers().getId(), request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<ScheduleResponse>builder()
                .success(true)
                .message("Lưu thời khóa biểu thành công")
                .data(response)
                .build());
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<ScheduleResponse>> getActiveSchedule(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        ScheduleResponse response = scheduleService.getActiveSchedule(userPrincipal.getUsers().getId());
        
        return ResponseEntity.ok(ApiResponse.<ScheduleResponse>builder()
                .success(true)
                .message("Lấy thời khóa biểu thành công")
                .data(response)
                .build());
    }
}
