package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.gamification.LeaderboardResponse;
import com.vn.aitutor.entity.enums.LeaderboardScope;
import com.vn.aitutor.exception.StudentClassRequiredException;
import com.vn.aitutor.service.gamification.LeaderboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {
    private final LeaderboardService leaderboard;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    @SecurityRequirement(name = "studentCookieAuth")
    @Operation(summary = "Bảng xếp hạng XP của học sinh",
            description = "Cookie access_token; scope GLOBAL (mặc định) hoặc CLASS của current user; "
                    + "limit mặc định 20, từ 1 đến 50. Không nhận classId/studentId để chọn phạm vi. "
                    + "Xếp totalXp giảm dần, thời điểm đạt XP tăng dần, studentId tăng dần. "
                    + "Thời điểm không đủ bằng chứng ledger được xếp sau thời điểm xác định khi bằng XP. "
                    + "me luôn có rank trong cùng scope, kể cả ngoài top. Chỉ trả tên/avatar/XP/level/rank.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "ApiResponse<LeaderboardResponse>"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "scope/limit sai hoặc CLASS chưa có lớp (error.code=STUDENT_CLASS_REQUIRED)"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập hoặc cookie hết hạn"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Sai role hoặc chưa có hồ sơ học sinh"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy tài khoản hiện tại")
    })
    public ApiResponse<LeaderboardResponse> getLeaderboard(
            @RequestParam(defaultValue = "GLOBAL") LeaderboardScope scope,
            @Parameter(schema = @Schema(minimum = "1", maximum = "50", defaultValue = "20"))
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.<LeaderboardResponse>builder().success(true)
                .message("Lấy bảng xếp hạng thành công").data(leaderboard.getLeaderboard(scope, limit)).build();
    }

    @ExceptionHandler(StudentClassRequiredException.class)
    public ResponseEntity<ApiResponse<Void>> classRequired(StudentClassRequiredException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.<Void>builder().success(false)
                .message(exception.getMessage()).error(Map.of("code", "STUDENT_CLASS_REQUIRED")).build());
    }
}
