package com.vn.aitutor.service.curriculum;

import com.vn.aitutor.dto.request.curriculum.SkillCreateRequest;
import com.vn.aitutor.dto.request.curriculum.SkillUpdateRequest;
import com.vn.aitutor.dto.response.curriculum.LessonSummaryResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.curriculum.SkillResponse;
import java.util.List;
import java.util.UUID;

public interface ISkillService {

    PageResponseDTO<SkillResponse> searchSkills(
            String keyword,
            String subject,
            String gradeLevel,
            int page,
            int size,
            String sort,
            String direction
    );

    SkillResponse getSkillById(UUID id);

    SkillResponse createSkill(SkillCreateRequest request);

    SkillResponse updateSkill(UUID id, SkillUpdateRequest request);

    void deleteSkill(UUID id);

    List<LessonSummaryResponse> getAssignedLessons(UUID skillId);

    List<LessonSummaryResponse> getAvailableLessonsForSkill(UUID skillId);

    void assignLessons(UUID skillId, List<UUID> lessonIds);
}
