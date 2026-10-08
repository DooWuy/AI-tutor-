package com.vn.aitutor.service;

import com.vn.aitutor.agent.QuestionGeneratorAgent;
import com.vn.aitutor.dto.request.AIGenerateQuestionRequest;
import com.vn.aitutor.dto.request.QuestionBankCreateRequest;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.entity.QuestionBank;
import com.vn.aitutor.entity.Skill;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.SkillRepository;
import java.util.List;
import com.vn.aitutor.dto.response.QuestionBankListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AIQuestionService {

    private final QuestionGeneratorAgent questionGeneratorAgent;
    private final QuestionBankRepository questionBankRepository;
    private final SkillRepository skillRepository;

    @Transactional
    public List<QuestionBankCreateRequest> generateQuestions(AIGenerateQuestionRequest request) {
        Skill skill = skillRepository.findById(request.getSkillId())
                .orElseThrow(() -> new RuntimeException("Skill not found"));
        
        QuestionBankListResponse generatedWrapper = questionGeneratorAgent.generateQuestions(
                skill.getSubject() != null ? skill.getSubject() : "Tổng hợp",
                skill.getGradeLevel() != null ? skill.getGradeLevel() : "Phổ thông",
                skill.getName() + (skill.getDescription() != null ? " - " + skill.getDescription() : ""),
                request.getDifficulty(),
                request.getCount()
        );
        List<QuestionBankCreateRequest> generated = generatedWrapper.getQuestions();

        for (QuestionBankCreateRequest q : generated) {
            QuestionBank qb = new QuestionBank();
            qb.setStem(q.getStem());
            qb.setType(q.getType() != null ? q.getType() : QuestionType.MULTIPLE_CHOICE);
            qb.setDifficulty(q.getDifficulty() != null ? q.getDifficulty() : request.getDifficulty());
            qb.setChoices(q.getChoices() != null ? q.getChoices() : List.of());
            qb.setCorrectAnswer(q.getCorrectAnswer());
            qb.setExplanation(q.getExplanation());
            qb.setTags(q.getTags());
            qb.setSkill(skill);
            questionBankRepository.save(qb);
            
            // set back the skill ID for response
            q.setSkillId(skill.getId());
        }

        return generated;
    }
}


