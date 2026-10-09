package com.vn.aitutor.service.impl;

import com.vn.aitutor.dto.response.QuizAttemptAnswerDto;
import com.vn.aitutor.dto.response.QuizAttemptDetailResponse;
import com.vn.aitutor.dto.response.QuizAttemptHistoryResponse;
import com.vn.aitutor.entity.QuizAttempt;
import com.vn.aitutor.entity.QuizAttemptAnswer;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.service.QuizAccessService;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.service.IStudentQuizAttemptService;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentQuizAttemptServiceImpl implements IStudentQuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptAnswerRepository quizAttemptAnswerRepository;
    private final QuizAccessService access;

    @Override
    public List<QuizAttemptHistoryResponse> getMyHistory() {
        Student currentUser = access.currentStudent();
        List<QuizAttempt> attempts = quizAttemptRepository.findVisibleHistoryByStudentId(currentUser.getId());
        
        return attempts.stream().map(a -> QuizAttemptHistoryResponse.builder()
                .id(a.getId())
                .quizId(a.getQuiz().getId())
                .quizTitle(a.getQuiz().getTitle())
                .isAiGenerated(a.getQuiz().isAiGenerated())
                .score(a.getScore())
                .xpEarned(a.getXpEarned())
                .durationSeconds(a.getDurationSeconds())
                .submittedAt(a.getSubmittedAt())
                .build()
        ).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void hideAttempt(UUID attemptId) {
        Student currentUser = access.currentStudent();
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz attempt not found"));

        if (!attempt.getStudent().getId().equals(currentUser.getId())) {
            throw new ResourceForbiddenException("You do not have permission to hide this attempt");
        }

        if (!attempt.getQuiz().isAiGenerated()) {
            throw new ResourceForbiddenException("Cannot hide assigned quizzes");
        }

        attempt.setIsVisible(false);
        quizAttemptRepository.save(attempt);
    }

    @Override
    public QuizAttemptDetailResponse getAttemptDetail(UUID attemptId) {
        Student currentUser = access.currentStudent();
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz attempt not found"));

        if (!attempt.getStudent().getId().equals(currentUser.getId())) {
            throw new ResourceForbiddenException("You do not have permission to view this attempt");
        }

        List<QuizAttemptAnswer> answers = quizAttemptAnswerRepository.findByAttemptId(attemptId);
        List<QuizAttemptAnswerDto> answerDtos = answers.stream()
                .sorted(Comparator.comparing(a -> a.getQuestion().getOrderIndex()))
                .map(a -> QuizAttemptAnswerDto.builder()
                        .questionId(a.getQuestion().getId())
                        .questionText(a.getQuestion().getQuestionText())
                        .type(a.getQuestion().getType())
                        .options(a.getQuestion().getOptions())
                        .selectedOptionKey(a.getSelectedOptionKey())
                        .correctOptionKey(a.getQuestion().getCorrectOptionKey())
                        .explanation(a.getQuestion().getExplanation())
                        .isCorrect(a.isCorrect())
                        .orderIndex(a.getQuestion().getOrderIndex())
                        .build())
                .collect(Collectors.toList());

        return QuizAttemptDetailResponse.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .isAiGenerated(attempt.getQuiz().isAiGenerated())
                .score(attempt.getScore())
                .xpEarned(attempt.getXpEarned())
                .correctCount(attempt.getCorrectCount() != null ? attempt.getCorrectCount() : (int) answers.stream().filter(QuizAttemptAnswer::isCorrect).count())
                .totalQuestions(answers.size())
                .totalXp(currentUser.getTotalXp())
                .currentLevel(currentUser.getCurrentLevel())
                .durationSeconds(attempt.getDurationSeconds())
                .submittedAt(attempt.getSubmittedAt())
                .answers(answerDtos)
                .build();
    }

}
