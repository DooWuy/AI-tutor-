package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.StudentProgressResponse;
import com.vn.aitutor.service.StudentProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/students/me/progress")
@RequiredArgsConstructor
@SecurityScheme(name = "studentCookieAuth", type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.COOKIE, paramName = "access_token")
public class StudentProgressController {
    private final StudentProgressService progress;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    @SecurityRequirement(name = "studentCookieAuth")
    @Operation(summary = "Tiến độ học tập của học sinh hiện tại",
            description = "Cookie auth. Không nhận studentId. 7 ngày gồm hôm nay theo app.academic.timezone; "
                    + "phút học = tổng giây làm quiz / 60 làm tròn xuống. XP ngày/môn từ ledger; "
                    + "summary từ Student. Tối đa 5 quiz gần đây chưa ẩn; tổng hợp vẫn tính lượt đã ẩn. "
                    + "Streak hiệu lực không phụ thuộc scheduler; không trả answer key hoặc PII.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "ApiResponse<StudentProgressResponse>"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực hoặc cookie hết hạn"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có ROLE_STUDENT hoặc chưa có hồ sơ Student"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tài khoản không còn active hoặc đã bị xóa")
    })
    public ApiResponse<StudentProgressResponse> getMyProgress() {
        return ApiResponse.<StudentProgressResponse>builder().success(true)
                .message("Lấy tiến độ học tập thành công").data(progress.getMyProgress()).build();
    }
}
