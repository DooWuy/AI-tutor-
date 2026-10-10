package com.vn.aitutor.service;

import com.vn.aitutor.dto.response.SkillDto;
import com.vn.aitutor.entity.Skill;
import com.vn.aitutor.repository.SkillRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private SkillDto mapToDto(Skill skill) {
        SkillDto dto = new SkillDto();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        dto.setCode(skill.getCode());
        dto.setSubject(skill.getSubject());
        dto.setGradeLevel(skill.getGradeLevel());
        dto.setDescription(skill.getDescription());
        return dto;
    }
}

