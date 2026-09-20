package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.ScheduleCreateRequest;
import com.vn.aitutor.dto.response.OcrExtractionResponse;
import com.vn.aitutor.dto.response.ScheduleResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface IScheduleService {
    OcrExtractionResponse extractScheduleFromImage(MultipartFile file) throws Exception;
    ScheduleResponse createSchedule(UUID userId, ScheduleCreateRequest request);
    ScheduleResponse getActiveSchedule(UUID userId);
}
