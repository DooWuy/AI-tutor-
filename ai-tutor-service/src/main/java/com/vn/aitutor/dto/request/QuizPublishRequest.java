package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class QuizPublishRequest {

    @NotEmpty(message = "Chọn ít nhất một lớp để phát hành")
    private List<@NotNull(message = "Lớp phát hành không hợp lệ") UUID> classIds;
}
