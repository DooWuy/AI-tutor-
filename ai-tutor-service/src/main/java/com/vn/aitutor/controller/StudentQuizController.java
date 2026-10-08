package com.vn.aitutor.controller;

import com.vn.aitutor.dto.response.StudentQuizDto;
import com.vn.aitutor.dto.request.StudentQuizGenerateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.service.StudentQuizService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/student/quizzes")
@RequiredArgsConstructor
public class StudentQuizController {

    private final StudentQuizService studentQuizService;

    @GetMapping("/assigned")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentQuizDto>>> getAssignedQuizzes(
            @RequestParam("subject") String subject) {
        
        List<StudentQuizDto> data = studentQuizService.getAssignedQuizzes(subject);
        return ResponseEntity.ok(ApiResponse.<List<StudentQuizDto>>builder()
                .success(true)
                .message("Fetched assigned quizzes successfully")
                .data(data)
                .build());
    }

    @GetMapping("/custom")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentQuizDto>>> getCustomQuizzes(
            @RequestParam("subject") String subject) {
        
        List<StudentQuizDto> data = studentQuizService.getCustomQuizzes(subject);
        return ResponseEntity.ok(ApiResponse.<List<StudentQuizDto>>builder()
                .success(true)
                .message("Fetched custom quizzes successfully")
                .data(data)
                .build());
    }

    @PostMapping("/generate-ai")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentQuizDto>> generateCustomQuiz(
            @RequestBody StudentQuizGenerateRequest request) {
        
        StudentQuizDto data = studentQuizService.generateCustomQuiz(request);
        return ResponseEntity.ok(ApiResponse.<StudentQuizDto>builder()
                .success(true)
                .message("Generated quiz successfully")
                .data(data)
                .build());
    }
}


