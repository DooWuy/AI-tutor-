package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AlertSettingsRequest {

    @NotNull(message = "Ngưỡng điểm không được để trống")
    private BigDecimal scoreThreshold;

    @NotNull(message = "Số ngày không hoạt động không được để trống")
    private Integer inactivityDays;

    @NotNull(message = "Số lỗ hổng tối đa không được để trống")
    private Integer maxGapTopics;

    @NotBlank(message = "Mẫu tin nhắn không được để trống")
    private String messageTemplate;
}
