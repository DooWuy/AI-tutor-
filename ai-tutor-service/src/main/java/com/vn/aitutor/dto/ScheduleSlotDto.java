package com.vn.aitutor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleSlotDto {
    private UUID id;
    private String subjectName;
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String teacherName;
    private String room;
    private String scheduleType;
}
