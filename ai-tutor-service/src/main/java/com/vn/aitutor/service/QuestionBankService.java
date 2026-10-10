package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.BulkDeleteRequest;
import com.vn.aitutor.dto.request.QuestionBankCreateRequest;
import com.vn.aitutor.dto.response.QuestionBankDto;
import com.vn.aitutor.entity.QuestionBank;
import com.vn.aitutor.entity.Skill;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.SkillRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuestionBankService {

    private final QuestionBankRepository questionBankRepository;
    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public Page<QuestionBankDto> getQuestionsBySkill(UUID skillId, Pageable pageable) {
        return questionBankRepository.findBySkillId(skillId, pageable).map(this::mapToDto);
    }

    @Transactional
    public QuestionBankDto createQuestion(QuestionBankCreateRequest request) {
        Skill skill = null;
        if (request.getSkillId() != null) {
            skill = skillRepository.findById(request.getSkillId())
                    .orElseThrow(() -> new RuntimeException("Skill not found"));
        }
        QuestionBank qb = new QuestionBank();
        qb.setStem(request.getStem());
        qb.setDifficulty(request.getDifficulty());
        qb.setChoices(request.getChoices());
        qb.setCorrectAnswer(request.getCorrectAnswer());
        qb.setExplanation(request.getExplanation());
        qb.setTags(request.getTags());
        qb.setSkill(skill);
        qb = questionBankRepository.save(qb);
        return mapToDto(qb);
    }

    @Transactional
    public QuestionBankDto updateQuestion(UUID id, QuestionBankCreateRequest request) {
        QuestionBank qb = questionBankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        
        Skill skill = null;
        if (request.getSkillId() != null) {
            skill = skillRepository.findById(request.getSkillId())
                    .orElseThrow(() -> new RuntimeException("Skill not found"));
        }

        qb.setStem(request.getStem());
        qb.setDifficulty(request.getDifficulty());
        qb.setChoices(request.getChoices());
        qb.setCorrectAnswer(request.getCorrectAnswer());
        qb.setExplanation(request.getExplanation());
        qb.setTags(request.getTags());
        qb.setSkill(skill);
        return mapToDto(questionBankRepository.save(qb));
    }

    @Transactional
    public void deleteQuestion(UUID id) {
        questionBankRepository.deleteById(id);
    }

    @Transactional
    public void bulkDelete(BulkDeleteRequest request) {
        if (request.getIds() != null && !request.getIds().isEmpty()) {
            questionBankRepository.deleteAllById(request.getIds());
        }
    }

    private QuestionBankDto mapToDto(QuestionBank qb) {
        QuestionBankDto dto = new QuestionBankDto();
        dto.setId(qb.getId());
        dto.setStem(qb.getStem());
        dto.setDifficulty(qb.getDifficulty());
        dto.setChoices(qb.getChoices());
        dto.setCorrectAnswer(qb.getCorrectAnswer());
        dto.setExplanation(qb.getExplanation());
        dto.setTags(qb.getTags());
        if (qb.getSkill() != null) {
            dto.setSkillId(qb.getSkill().getId());
        }
        return dto;
    }
}



