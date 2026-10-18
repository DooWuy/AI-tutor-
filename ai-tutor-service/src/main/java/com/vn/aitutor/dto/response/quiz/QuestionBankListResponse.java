package com.vn.aitutor.dto.response.quiz;

import com.vn.aitutor.dto.request.quiz.QuestionBankCreateRequest;
import java.util.List;
import lombok.Data;

@Data
public class QuestionBankListResponse {
    private List<QuestionBankCreateRequest> questions;
}
