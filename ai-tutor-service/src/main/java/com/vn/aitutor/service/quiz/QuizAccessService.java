package com.vn.aitutor.service.quiz;

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
    private final QuizClassAssignmentRepository assignments;
    private final QuizStudyClassAssignmentRepository studyAssignments;

    public Student currentStudent() {
        String name = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = users.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(name)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return students.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceForbiddenException("Student profile required"));
    }

    public Quiz requireQuiz(UUID id, Student student) {
        Quiz quiz = quizzes.findById(id).orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        boolean ownPractice = quiz.isAiGenerated()
                && quiz.getCreatedBy() != null
                && student.getUser() != null
                && quiz.getCreatedBy().getId().equals(student.getUser().getId());
        boolean schoolAssigned = false;
        boolean studyAssigned = false;
        if (!ownPractice) {
            schoolAssigned = assignedToSchool(quiz, student);
            studyAssigned = assignedToStudyClass(quiz, student);
            if (!schoolAssigned && !studyAssigned) {
                throw new ResourceForbiddenException("Đề thi không được giao cho lớp của bạn");
            }
        }
        if (!quiz.isActive()) throw new ResourceConflictException("Quiz is inactive");
        if (!studyAssigned && quiz.getGradeLevel() != null && !quiz.getGradeLevel().isBlank()
                && !quiz.getGradeLevel().equals(student.getGradeLevel())
                && (student.getClassEntity() == null || !quiz.getGradeLevel().equals(student.getClassEntity().getGradeLevel())))
            throw new ResourceForbiddenException("Quiz does not match your grade");
        if (!"READY".equals(quiz.getGenerationStatus()))
            throw new ResourceConflictException("Quiz is not ready");
        return quiz;
    }

    private boolean assignedToSchool(Quiz quiz, Student student) {
        if (student.getClassEntity() == null || student.getClassEntity().getId() == null) return false;
        return assignments.existsByQuiz_IdAndSchoolClass_Id(quiz.getId(), student.getClassEntity().getId());
    }

    private boolean assignedToStudyClass(Quiz quiz, Student student) {
        if (student.getId() == null) return false;
        return studyAssignments.existsApprovedActive(quiz.getId(), student.getId());
    }

    public List<QuizQuestion> readyQuestions(UUID quizId) {
        List<QuizQuestion> result = questions.findByQuizIdOrderByOrderIndexAsc(quizId);
        if (result.isEmpty() || result.stream().anyMatch(q -> !validQuestion(q)))
            throw new ResourceConflictException("Quiz has incomplete questions");
        return result;
    }

    public static boolean validQuestion(QuizQuestion q) {
        if (q.getQuestionText() == null || q.getQuestionText().isBlank()) return false;
        QuestionType type = q.getType() == null ? QuestionType.MULTIPLE_CHOICE : q.getType();
        if (type == QuestionType.FILL_BLANK) {
            String answer = q.getCorrectText() != null && !q.getCorrectText().isBlank()
                    ? q.getCorrectText()
                    : q.getCorrectOptionKey();
            return answer != null && !answer.isBlank() && answer.length() <= 500;
        }
        if (q.getCorrectOptionKey() == null || q.getCorrectOptionKey().isBlank()
                || q.getCorrectOptionKey().length() > 200) return false;
        if (type == QuestionType.MULTI_SELECT) {
            if (q.getOptions() == null || q.getOptions().size() < 2) return false;
            Set<String> expected = QuizGradingService.choiceKeys(q.getCorrectOptionKey());
            if (expected.size() < 2) return false;
            Set<String> optionKeys = new HashSet<>();
            for (var option : q.getOptions()) {
                if (!(option.get("key") instanceof String key) || key.isBlank()) return false;
                Object body = option.get("content") != null ? option.get("content") : option.get("text");
                if (!(body instanceof String text) || text.isBlank()) return false;
                optionKeys.add(key.toUpperCase(Locale.ROOT));
            }
            return optionKeys.containsAll(expected);
        }
        if (type == QuestionType.MULTIPLE_CHOICE || type == QuestionType.TRUE_FALSE) {
            if (q.getOptions() == null || q.getOptions().size() < 2) return false;
            boolean allOptionsValid = q.getOptions().stream().allMatch(o -> {
                if (!(o.get("key") instanceof String key) || key.isBlank()) return false;
                Object body = o.get("content") != null ? o.get("content") : o.get("text");
                return body instanceof String text && !text.isBlank();
            });
            if (!allOptionsValid) return false;
            String correctKey = q.getCorrectOptionKey().trim();
            return q.getOptions().stream().anyMatch(o -> {
                Object k = o.get("key");
                return k instanceof String key && key.trim().equalsIgnoreCase(correctKey);
            });
        }
        return true;
    }
}
