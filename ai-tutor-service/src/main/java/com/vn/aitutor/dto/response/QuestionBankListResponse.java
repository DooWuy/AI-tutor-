package com.vn.aitutor.dto.response;

import com.vn.aitutor.dto.request.QuestionBankCreateRequest;
import java.util.List;
import lombok.Data;

@Data
public class QuestionBankListResponse {
    private List<QuestionBankCreateRequest> questions;
}
