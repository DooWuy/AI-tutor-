package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.AIGenerateQuestionRequest;
import com.vn.aitutor.dto.request.BulkDeleteRequest;
import com.vn.aitutor.dto.request.QuestionBankCreateRequest;
import com.vn.aitutor.dto.response.QuestionBankDto;
import com.vn.aitutor.service.AIQuestionService;
import com.vn.aitutor.service.QuestionBankService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/v1/question-bank")
@RequiredArgsConstructor
public class QuestionBankController {

    private final QuestionBankService questionBankService;
    private final AIQuestionService aiQuestionService;

    @GetMapping
    public ResponseEntity<Page<QuestionBankDto>> getQuestions(
            @RequestParam UUID skillId,
            Pageable pageable) {
        return ResponseEntity.ok(questionBankService.getQuestionsBySkill(skillId, pageable));
    }

    @PostMapping
    public ResponseEntity<QuestionBankDto> createQuestion(@RequestBody QuestionBankCreateRequest request) {
        return ResponseEntity.ok(questionBankService.createQuestion(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionBankDto> updateQuestion(
            @PathVariable UUID id,
            @RequestBody QuestionBankCreateRequest request) {
        return ResponseEntity.ok(questionBankService.updateQuestion(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable UUID id) {
        questionBankService.deleteQuestion(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> bulkDelete(@RequestBody BulkDeleteRequest request) {
        questionBankService.bulkDelete(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/generate-ai")
    public ResponseEntity<List<QuestionBankCreateRequest>> generateQuestionsWithAI(
            @RequestBody AIGenerateQuestionRequest request) {
        return ResponseEntity.ok(aiQuestionService.generateQuestions(request));
    }
}




