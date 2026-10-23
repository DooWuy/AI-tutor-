package com.vn.aitutor.dto.request.quiz;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class QuizPublishRequest {

    private List<@NotNull(message = "Lớp phát hành không hợp lệ") UUID> classIds;

    private List<@NotNull(message = "Lớp học thêm không hợp lệ") UUID> studyClassIds;

    private Instant availableFrom;

    private Instant availableUntil;
}
