package com.vn.aitutor.dto.request.classroom;

import com.vn.aitutor.dto.response.classroom.ScheduleSlotDto;
import lombok.Data;

import java.util.List;

@Data
public class ScheduleCreateRequest {
    private String name;
    private List<ScheduleSlotDto> slots;
    private Boolean allowOverlap;
}

