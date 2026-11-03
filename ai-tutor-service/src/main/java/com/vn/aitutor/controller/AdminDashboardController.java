package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.dashboard.AdminDashboardResponse;
import com.vn.aitutor.repository.AdminDashboardRepository;
import com.vn.aitutor.exception.ResourceBadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard/admin")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final AdminDashboardRepository dashboard;
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary="All-time Admin dashboard", description="Counts non-deleted users (including locked), all documents/quizzes/chat sessions and submitted quiz attempts (including hidden history). No query parameters supported. Fresh database snapshot on every request; updatedAt in UTC.")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> overview(@RequestParam Map<String,String> params) {
        if (!params.isEmpty()) throw new ResourceBadRequestException("Dashboard chỉ hỗ trợ toàn thời gian, không nhận bộ lọc ngày");
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.<AdminDashboardResponse>builder()
                .success(true).data(dashboard.overview()).build());
    }
}
