package com.vn.aitutor.dto.response.classroom;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OcrExtractionResponse {
    private String name;
    private List<ScheduleSlotDto> slots;
}

