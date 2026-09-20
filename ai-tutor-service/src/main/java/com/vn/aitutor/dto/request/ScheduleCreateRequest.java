package com.vn.aitutor.dto.request;

import com.vn.aitutor.dto.ScheduleSlotDto;
import lombok.Data;

import java.util.List;

@Data
public class ScheduleCreateRequest {
    private String name;
    private List<ScheduleSlotDto> slots;
}
