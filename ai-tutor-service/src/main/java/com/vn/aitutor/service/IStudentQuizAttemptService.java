package com.vn.aitutor.service;

import com.vn.aitutor.dto.response.QuizAttemptHistoryResponse;
import com.vn.aitutor.dto.response.QuizAttemptDetailResponse;
import java.util.List;
import java.util.UUID;

public interface IStudentQuizAttemptService {
    List<QuizAttemptHistoryResponse> getMyHistory();
    void hideAttempt(UUID attemptId);
    QuizAttemptDetailResponse getAttemptDetail(UUID attemptId);
}
