package com.vn.aitutor.service.curriculum;

import com.vn.aitutor.dto.request.curriculum.SkillCreateRequest;
import com.vn.aitutor.dto.request.curriculum.SkillUpdateRequest;
import com.vn.aitutor.dto.response.curriculum.SkillResponse;
import com.vn.aitutor.entity.Skill;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.LessonSkillRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.SkillRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillServiceImplTest {

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private LessonSkillRepository lessonSkillRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private QuestionBankRepository questionBankRepository;

    private SkillServiceImpl skillService;

    @BeforeEach
    void setUp() {
        skillService = new SkillServiceImpl(
                skillRepository,
                lessonSkillRepository,
                lessonRepository,
                questionBankRepository
        );
    }

    @Test
    void createSkill_success() {
        SkillCreateRequest request = SkillCreateRequest.builder()
                .code("MATH_GEOM_01")
                .name("Hình học phẳng")
                .subject("Toán")
                .gradeLevel("10")
                .importance(5)
                .masteryThreshold(new BigDecimal("0.85"))
                .minAttempts(4)
                .canSkip(false)
                .build();

        when(skillRepository.existsByCode("MATH_GEOM_01")).thenReturn(false);
        when(skillRepository.save(any(Skill.class))).thenAnswer(i -> {
            Skill s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        SkillResponse res = skillService.createSkill(request);
        assertNotNull(res.getId());
        assertEquals("MATH_GEOM_01", res.getSkillCode());
        assertEquals("Hình học phẳng", res.getName());
    }

    @Test
    void createSkill_duplicateCode_throwsConflict() {
        SkillCreateRequest request = SkillCreateRequest.builder()
                .code("MATH_GEOM_01")
                .name("Hình học phẳng")
                .build();

        when(skillRepository.existsByCode("MATH_GEOM_01")).thenReturn(true);

        assertThrows(ResourceConflictException.class, () -> skillService.createSkill(request));
    }

    @Test
    void createSkill_invalidMasteryThreshold_throwsBadRequest() {
        SkillCreateRequest request = SkillCreateRequest.builder()
                .code("MATH_01")
                .name("Đại số")
                .masteryThreshold(new BigDecimal("1.50"))
                .build();

        when(skillRepository.existsByCode("MATH_01")).thenReturn(false);

        assertThrows(ResourceBadRequestException.class, () -> skillService.createSkill(request));
    }

    @Test
    void updateSkill_notFound_throwsNotFound() {
        UUID id = UUID.randomUUID();
        SkillUpdateRequest request = SkillUpdateRequest.builder()
                .code("MATH_01")
                .name("Đại số")
                .importance(1)
                .masteryThreshold(new BigDecimal("0.90"))
                .minAttempts(3)
                .canSkip(false)
                .build();

        when(skillRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> skillService.updateSkill(id, request));
    }

    @Test
    void deleteSkill_success() {
        UUID id = UUID.randomUUID();
        Skill skill = Skill.builder().id(id).code("TEST").build();

        when(skillRepository.findById(id)).thenReturn(Optional.of(skill));

        skillService.deleteSkill(id);

        verify(lessonSkillRepository).deleteBySkillId(id);
        verify(skillRepository).delete(skill);
    }
}
