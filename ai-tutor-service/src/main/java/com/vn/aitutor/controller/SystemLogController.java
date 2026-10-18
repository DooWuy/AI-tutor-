package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.system.SystemLogResponse;
import com.vn.aitutor.service.system.ISystemLogService;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class SystemLogController {

    private final ISystemLogService systemLogService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<SystemLogResponse>> searchLogs(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseEntity.ok(systemLogService.searchLogs(level, keyword, fromDate, toDate, page, size, direction));
    }

    @DeleteMapping("/purge")
    public ResponseEntity<ApiResponse<Integer>> purgeOldLogs(@RequestParam(defaultValue = "30") int daysOld) {
        int purged = systemLogService.purgeOldLogs(daysOld);
        return ResponseEntity.ok(ApiResponse.<Integer>builder()
                .success(true)
                .message("Đã xóa " + purged + " bản ghi log cũ")
                .data(purged)
                .build());
    }
}
