package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class AssignQuestionsRequest {

    @NotEmpty(message = "Hãy chọn ít nhất một câu hỏi")
    private List<@NotNull UUID> questionIds;
}
