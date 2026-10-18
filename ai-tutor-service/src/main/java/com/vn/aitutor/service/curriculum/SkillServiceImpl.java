package com.vn.aitutor.service.curriculum;

import com.vn.aitutor.dto.request.curriculum.SkillCreateRequest;
import com.vn.aitutor.dto.request.curriculum.SkillUpdateRequest;
import com.vn.aitutor.dto.response.curriculum.LessonSummaryResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.curriculum.SkillResponse;
import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.entity.LessonSkill;
import com.vn.aitutor.entity.Skill;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.LessonSkillRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.SkillRepository;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SkillServiceImpl implements ISkillService {

    private final SkillRepository skillRepository;
    private final LessonSkillRepository lessonSkillRepository;
    private final LessonRepository lessonRepository;
    private final QuestionBankRepository questionBankRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<SkillResponse> searchSkills(
            String keyword,
            String subject,
            String gradeLevel,
            int page,
            int size,
            String sort,
            String direction
    ) {
        if (page < 1 || size < 1 || size > 100) {
            throw new ResourceBadRequestException("page phải >= 1 và size phải từ 1 đến 100");
        }
        Sort.Direction sortDirection;
        try {
            sortDirection = Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException e) {
            sortDirection = Sort.Direction.ASC;
        }

        String sortProperty = switch (sort) {
            case "name" -> "name";
            case "importance" -> "importance";
            case "masteryThreshold" -> "masteryThreshold";
            case "createdAt" -> "createdAt";
            default -> "code";
        };

        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(sortDirection, sortProperty));
        Page<Skill> pagedSkills = skillRepository.searchSkills(
                (keyword == null || keyword.isBlank()) ? null : keyword.trim(),
                (subject == null || subject.isBlank()) ? null : subject.trim(),
                (gradeLevel == null || gradeLevel.isBlank()) ? null : gradeLevel.trim(),
                pageRequest
        );

        List<SkillResponse> content = pagedSkills.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponseDTO.<SkillResponse>builder()
                .page(page)
                .size(size)
                .totalElements(pagedSkills.getTotalElements())
                .totalPages(pagedSkills.getTotalPages())
                .content(content)
                .hasNext(pagedSkills.hasNext())
                .hasPrevious(pagedSkills.hasPrevious())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SkillResponse getSkillById(UUID id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỹ năng với ID: " + id));
        return toResponse(skill);
    }

    @Override
    @Transactional
    public SkillResponse createSkill(SkillCreateRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (skillRepository.existsByCode(code)) {
            throw new ResourceConflictException("Mã kỹ năng đã tồn tại: " + code);
        }

        validateMasteryThreshold(request.getMasteryThreshold());

        Skill skill = Skill.builder()
                .code(code)
                .name(request.getName().trim())
                .subject(request.getSubject() != null ? request.getSubject().trim() : null)
                .gradeLevel(request.getGradeLevel() != null ? request.getGradeLevel().trim() : null)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .importance(request.getImportance() != null ? request.getImportance() : 1)
                .masteryThreshold(request.getMasteryThreshold() != null ? request.getMasteryThreshold() : new BigDecimal("0.90"))
                .minAttempts(request.getMinAttempts() != null ? request.getMinAttempts() : 3)
                .canSkip(Boolean.TRUE.equals(request.getCanSkip()))
                .build();

        Skill saved = skillRepository.save(skill);
        log.info("Created skill: id={}, code={}", saved.getId(), saved.getCode());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public SkillResponse updateSkill(UUID id, SkillUpdateRequest request) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỹ năng với ID: " + id));

        String code = request.getCode().trim().toUpperCase();
        if (skillRepository.existsByCodeAndIdNot(code, id)) {
            throw new ResourceConflictException("Mã kỹ năng đã được sử dụng bởi kỹ năng khác: " + code);
        }

        validateMasteryThreshold(request.getMasteryThreshold());

        skill.setCode(code);
        skill.setName(request.getName().trim());
        skill.setSubject(request.getSubject() != null ? request.getSubject().trim() : null);
        skill.setGradeLevel(request.getGradeLevel() != null ? request.getGradeLevel().trim() : null);
        skill.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        skill.setImportance(request.getImportance());
        skill.setMasteryThreshold(request.getMasteryThreshold());
        skill.setMinAttempts(request.getMinAttempts());
        skill.setCanSkip(Boolean.TRUE.equals(request.getCanSkip()));

        Skill saved = skillRepository.save(skill);
        log.info("Updated skill: id={}, code={}", saved.getId(), saved.getCode());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteSkill(UUID id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỹ năng với ID: " + id));

        lessonSkillRepository.deleteBySkillId(id);
        skillRepository.delete(skill);
        log.info("Deleted skill: id={}, code={}", id, skill.getCode());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LessonSummaryResponse> getAssignedLessons(UUID skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Không tìm thấy kỹ năng với ID: " + skillId);
        }
        List<LessonSkill> links = lessonSkillRepository.findBySkillId(skillId);
        return links.stream().map(link -> toLessonSummary(link.getLesson(), true)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LessonSummaryResponse> getAvailableLessonsForSkill(UUID skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỹ năng với ID: " + skillId));

        Set<UUID> assignedIds = new HashSet<>(lessonSkillRepository.findLessonIdsBySkillId(skillId));
        List<Lesson> allLessons = lessonRepository.findAllWithChapterAndBook();

        return allLessons.stream()
                .filter(lesson -> matchesFilter(lesson, skill.getSubject(), skill.getGradeLevel()))
                .map(lesson -> toLessonSummary(lesson, assignedIds.contains(lesson.getId())))
                .toList();
    }

    @Override
    @Transactional
    public void assignLessons(UUID skillId, List<UUID> lessonIds) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỹ năng với ID: " + skillId));

        lessonSkillRepository.deleteBySkillId(skillId);

        if (lessonIds != null && !lessonIds.isEmpty()) {
            List<Lesson> lessons = lessonRepository.findAllById(lessonIds);
            List<LessonSkill> links = lessons.stream()
                    .map(lesson -> LessonSkill.builder()
                            .skill(skill)
                            .lesson(lesson)
                            .build())
                    .toList();
            lessonSkillRepository.saveAll(links);
            log.info("Assigned {} lessons to skill {}", links.size(), skill.getCode());
        }
    }

    private void validateMasteryThreshold(BigDecimal threshold) {
        if (threshold == null || threshold.compareTo(BigDecimal.ZERO) < 0 || threshold.compareTo(BigDecimal.ONE) > 0) {
            throw new ResourceBadRequestException("Ngưỡng thành thạo (mastery_threshold) phải nằm trong khoảng từ 0.00 đến 1.00");
        }
    }

    private SkillResponse toResponse(Skill skill) {
        long questionCount = questionBankRepository.countQuestionsBySkillId(skill.getId());
        long lessonCount = lessonSkillRepository.findBySkillId(skill.getId()).size();

        return SkillResponse.builder()
                .id(skill.getId())
                .skillCode(skill.getCode())
                .name(skill.getName())
                .subject(skill.getSubject())
                .gradeLevel(skill.getGradeLevel())
                .description(skill.getDescription())
                .importance(skill.getImportance())
                .masteryThreshold(skill.getMasteryThreshold())
                .minAttempts(skill.getMinAttempts())
                .canSkip(skill.getCanSkip())
                .questionCount(questionCount)
                .assignedLessonCount(lessonCount)
                .createdAt(skill.getCreatedAt())
                .updatedAt(skill.getUpdatedAt())
                .build();
    }

    private boolean matchesFilter(Lesson lesson, String subject, String gradeLevel) {
        if (lesson.getChapter() == null || lesson.getChapter().getBook() == null) return true;
        var book = lesson.getChapter().getBook();
        if (subject != null && !subject.isBlank() && !subject.equalsIgnoreCase(book.getSubject())) {
            return false;
        }
        if (gradeLevel != null && !gradeLevel.isBlank()) {
            String bookGrade = String.valueOf(book.getGradeLevel());
            if (!gradeLevel.equalsIgnoreCase(bookGrade)) {
                return false;
            }
        }
        return true;
    }

    private LessonSummaryResponse toLessonSummary(Lesson lesson, boolean assigned) {
        String chapterTitle = lesson.getChapter() != null ? lesson.getChapter().getTitle() : null;
        String bookTitle = (lesson.getChapter() != null && lesson.getChapter().getBook() != null)
                ? lesson.getChapter().getBook().getTitle()
                : null;
        String subject = (lesson.getChapter() != null && lesson.getChapter().getBook() != null)
                ? lesson.getChapter().getBook().getSubject()
                : null;
        String gradeLevel = (lesson.getChapter() != null && lesson.getChapter().getBook() != null)
                ? lesson.getChapter().getBook().getGradeLevel()
                : null;

        return LessonSummaryResponse.builder()
                .id(lesson.getId())
                .lessonCode(lesson.getLessonCode())
                .title(lesson.getTitle())
                .chapterTitle(chapterTitle)
                .bookTitle(bookTitle)
                .subject(subject)
                .gradeLevel(gradeLevel)
                .assigned(assigned)
                .build();
    }
}
