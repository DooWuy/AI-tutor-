package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.curriculum.SkillCreateRequest;
import com.vn.aitutor.dto.request.curriculum.SkillLessonAssignRequest;
import com.vn.aitutor.dto.request.curriculum.SkillUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.curriculum.LessonSummaryResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.curriculum.SkillResponse;
import com.vn.aitutor.service.curriculum.ISkillService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/skills")
@RequiredArgsConstructor
public class SkillController {

    private final ISkillService skillService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<SkillResponse>> searchSkills(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String gradeLevel,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "code") String sort,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(skillService.searchSkills(keyword, subject, gradeLevel, page, size, sort, direction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SkillResponse>> getSkillById(@PathVariable UUID id) {
        SkillResponse skill = skillService.getSkillById(id);
        return ResponseEntity.ok(ApiResponse.<SkillResponse>builder()
                .success(true)
                .message("Lấy thông tin kỹ năng thành công")
                .data(skill)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SkillResponse>> createSkill(@Valid @RequestBody SkillCreateRequest request) {
        SkillResponse created = skillService.createSkill(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<SkillResponse>builder()
                .success(true)
                .message("Tạo kỹ năng mới thành công")
                .data(created)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SkillResponse>> updateSkill(
            @PathVariable UUID id,
            @Valid @RequestBody SkillUpdateRequest request
    ) {
        SkillResponse updated = skillService.updateSkill(id, request);
        return ResponseEntity.ok(ApiResponse.<SkillResponse>builder()
                .success(true)
                .message("Cập nhật kỹ năng thành công")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable UUID id) {
        skillService.deleteSkill(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa kỹ năng thành công")
                .build());
    }

    @GetMapping("/{id}/lessons")
    public ResponseEntity<ApiResponse<List<LessonSummaryResponse>>> getAssignedLessons(@PathVariable UUID id) {
        List<LessonSummaryResponse> lessons = skillService.getAssignedLessons(id);
        return ResponseEntity.ok(ApiResponse.<List<LessonSummaryResponse>>builder()
                .success(true)
                .message("Lấy danh sách bài học đã liên kết")
                .data(lessons)
                .build());
    }

    @GetMapping("/{id}/available-lessons")
    public ResponseEntity<ApiResponse<List<LessonSummaryResponse>>> getAvailableLessons(@PathVariable UUID id) {
        List<LessonSummaryResponse> lessons = skillService.getAvailableLessonsForSkill(id);
        return ResponseEntity.ok(ApiResponse.<List<LessonSummaryResponse>>builder()
                .success(true)
                .message("Lấy danh sách bài học có thể liên kết")
                .data(lessons)
                .build());
    }

    @PutMapping("/{id}/lessons")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignLessons(
            @PathVariable UUID id,
            @Valid @RequestBody SkillLessonAssignRequest request
    ) {
        skillService.assignLessons(id, request.getLessonIds());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Cập nhật liên kết bài học thành công")
                .build());
    }
}
