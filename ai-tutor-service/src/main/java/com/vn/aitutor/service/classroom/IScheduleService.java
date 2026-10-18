package com.vn.aitutor.service.classroom;

import com.vn.aitutor.dto.request.classroom.ScheduleCreateRequest;
import com.vn.aitutor.dto.response.classroom.OcrExtractionResponse;
import com.vn.aitutor.dto.response.classroom.ScheduleResponse;
import com.vn.aitutor.dto.response.classroom.ScheduleSlotDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface IScheduleService {
    OcrExtractionResponse extractScheduleFromImage(MultipartFile file) throws Exception;
    ScheduleResponse createSchedule(UUID userId, ScheduleCreateRequest request);
    ScheduleResponse getActiveSchedule(UUID userId);
    ScheduleSlotDto addScheduleSlot(UUID userId, ScheduleSlotDto request);
    ScheduleSlotDto updateScheduleSlot(UUID userId, UUID slotId, ScheduleSlotDto request);
    void deleteScheduleSlot(UUID userId, UUID slotId);
}
