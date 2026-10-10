package com.vn.aitutor.service;

import com.vn.aitutor.agent.QuestionGeneratorAgent;
import com.vn.aitutor.dto.request.QuestionBankCreateRequest;
import com.vn.aitutor.dto.response.StudentQuizDto;
import com.vn.aitutor.dto.request.StudentQuizGenerateRequest;
import com.vn.aitutor.entity.Quiz;
import com.vn.aitutor.entity.QuizQuestion;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.QuizDifficulty;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.QuizQuestionRepository;
import com.vn.aitutor.repository.QuizRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.dto.response.QuestionBankListResponse;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.mq.producer.QuizGenerationProducer;
import com.vn.aitutor.dto.request.QuizGenerationMessage;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentQuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final QuizGenerationProducer quizGenerationProducer;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAccessService access;

    @Transactional(readOnly = true)
    public List<StudentQuizDto> getAssignedQuizzes(String subject) {
        // Find assigned quizzes (not AI generated) for the subject
        List<Quiz> quizzes = quizRepository.findBySubjectAndAiGeneratedFalseOrderByCreatedAtDesc(subject);
        return mapToDtoList(quizzes);
    }

    @Transactional(readOnly = true)
    public List<StudentQuizDto> getCustomQuizzes(String subject) {
        User currentUser = getCurrentUser();
        List<Quiz> quizzes = quizRepository.findBySubjectAndAiGeneratedAndCreatedByIdOrderByCreatedAtDesc(subject, true, currentUser.getId());
        return mapToDtoList(quizzes);
    }

    public StudentQuizDto generateCustomQuiz(StudentQuizGenerateRequest request) {
        User currentUser = getCurrentUser();

        // Map 1-5 to QuizDifficulty enum
        QuizDifficulty diffEnum = mapDifficulty(request.getDifficulty());

        // Create Quiz entity
        Quiz quiz = new Quiz();
        quiz.setTitle("Bộ đề tự luyện: " + request.getTopic());
        quiz.setSubject(request.getSubjectId());
        quiz.setDifficulty(diffEnum);
        quiz.setTimeLimit(request.getCount() * 2); // 2 mins per question
        quiz.setAiGenerated(true);
        quiz.setCreatedBy(currentUser);
        quiz.setActive(true);
        quiz.setGenerationStatus("PROCESSING");
        
        quiz = quizRepository.save(quiz);

        // Get actual grade level
        String gradeLevel = "Phổ thông";
        Student student = studentRepository.findByUserId(currentUser.getId()).orElse(null);
        if (student != null) {
            if (student.getGradeLevel() != null && !student.getGradeLevel().isBlank()) {
                gradeLevel = student.getGradeLevel();
            } else if (student.getClassEntity() != null && student.getClassEntity().getGradeLevel() != null && !student.getClassEntity().getGradeLevel().isBlank()) {
                gradeLevel = student.getClassEntity().getGradeLevel();
            }
        }

        // Call AI Agent via message queue (Async)
        QuizGenerationMessage msg = new QuizGenerationMessage();
        msg.setQuizId(quiz.getId());
        msg.setSubject(request.getSubjectId());
        msg.setTopic(request.getTopic());
        msg.setDifficulty(request.getDifficulty());
        msg.setCount(request.getCount());
        msg.setGradeLevel(gradeLevel);
        quizGenerationProducer.sendQuizGenerationRequest(msg);

        return StudentQuizDto.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .duration(quiz.getTimeLimit())
                .questionCount(request.getCount())
                .status("PROCESSING") // Set status to PROCESSING
                .build();
    }

    private List<StudentQuizDto> mapToDtoList(List<Quiz> quizzes) {
        List<StudentQuizDto> result = new ArrayList<>();
        Student student = access.currentStudent();
        for (Quiz q : quizzes) {
            if (!q.isActive()) continue;
            if (q.getGradeLevel() != null && !q.getGradeLevel().isBlank() && !q.getGradeLevel().equals(student.getGradeLevel())
                    && (student.getClassEntity() == null || !q.getGradeLevel().equals(student.getClassEntity().getGradeLevel()))) continue;
            int qCount = quizQuestionRepository.countByQuizId(q.getId());
            result.add(StudentQuizDto.builder()
                    .id(q.getId())
                    .title(q.getTitle())
                    .duration(q.getTimeLimit() != null ? q.getTimeLimit() : 0)
                    .questionCount(qCount)
                    .status(!"READY".equals(q.getGenerationStatus()) ? q.getGenerationStatus()
                            : quizAttemptRepository.existsByStudentIdAndQuizId(student.getId(), q.getId()) ? "COMPLETED" : "PENDING")
                    .build());
        }
        return result;
    }

    private User getCurrentUser() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private QuizDifficulty mapDifficulty(int level) {
        if (level <= 2) return QuizDifficulty.EASY;
        if (level == 3) return QuizDifficulty.MEDIUM;
        return QuizDifficulty.HARD;
    }
}



