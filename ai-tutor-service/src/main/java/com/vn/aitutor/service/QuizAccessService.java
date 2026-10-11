package com.vn.aitutor.service;

import com.vn.aitutor.entity.*;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.exception.*;
import com.vn.aitutor.repository.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QuizAccessService {
    private final UserRepository users;
    private final StudentRepository students;
    private final QuizRepository quizzes;
    private final QuizQuestionRepository questions;

    public Student currentStudent() {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = users.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(name)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return students.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceForbiddenException("Student profile required"));
    }

    public Quiz requireQuiz(UUID id, Student student) {
        Quiz quiz = quizzes.findById(id).orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        if (quiz.isAiGenerated() && !quiz.getCreatedBy().getId().equals(student.getUser().getId()))
            throw new ResourceForbiddenException("Quiz belongs to another student");
        if (!quiz.isActive()) throw new ResourceConflictException("Quiz is inactive");
        if (quiz.getGradeLevel() != null && !quiz.getGradeLevel().isBlank()
                && !quiz.getGradeLevel().equals(student.getGradeLevel())
                && (student.getClassEntity() == null || !quiz.getGradeLevel().equals(student.getClassEntity().getGradeLevel())))
            throw new ResourceForbiddenException("Quiz does not match your grade");
        if (!"READY".equals(quiz.getGenerationStatus()))
            throw new ResourceConflictException("Quiz is not ready");
        return quiz;
    }

    public List<QuizQuestion> readyQuestions(UUID quizId) {
        List<QuizQuestion> result = questions.findByQuizIdOrderByOrderIndexAsc(quizId);
        if (result.isEmpty() || result.stream().anyMatch(q -> !validQuestion(q)))
            throw new ResourceConflictException("Quiz has incomplete questions");
        return result;
    }

    public static boolean validQuestion(QuizQuestion q) {
        if (q.getQuestionText() == null || q.getQuestionText().isBlank()
                || q.getCorrectOptionKey() == null || q.getCorrectOptionKey().isBlank()
                || q.getCorrectOptionKey().length() > 200
                || q.getExplanation() == null || q.getExplanation().isBlank()) return false;
        QuestionType type = q.getType() == null ? QuestionType.MULTIPLE_CHOICE : q.getType();
        if (type == QuestionType.MULTIPLE_CHOICE || type == QuestionType.TRUE_FALSE)
            return q.getOptions() != null && q.getOptions().size() >= 2
                    && q.getOptions().stream().allMatch(o -> o.get("key") instanceof String && o.get("content") instanceof String)
                    && q.getOptions().stream().filter(o -> q.getCorrectOptionKey().equals(o.get("key"))).count() == 1;
        return true;
    }
}
