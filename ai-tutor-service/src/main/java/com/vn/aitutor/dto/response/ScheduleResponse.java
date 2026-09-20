package com.vn.aitutor.dto.response;

import com.vn.aitutor.dto.ScheduleSlotDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ScheduleResponse {
    private UUID id;
    private String name;
    private boolean isActive;
    private List<ScheduleSlotDto> slots;
}
