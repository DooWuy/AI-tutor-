package com.vn.aitutor.service.quiz;

import com.vn.aitutor.dto.response.quiz.QuizAttemptHistoryResponse;
import com.vn.aitutor.dto.response.quiz.QuizAttemptDetailResponse;
import java.util.List;
import java.util.UUID;

public interface IStudentQuizAttemptService {
    List<QuizAttemptHistoryResponse> getMyHistory();
    void hideAttempt(UUID attemptId);
    QuizAttemptDetailResponse getAttemptDetail(UUID attemptId);
}
