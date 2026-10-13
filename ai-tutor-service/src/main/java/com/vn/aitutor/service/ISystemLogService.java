package com.vn.aitutor.service;

import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.SystemLogResponse;
import java.time.Instant;

public interface ISystemLogService {

    void log(String level, String message, String source, Throwable throwable);

    void log(String level, String message, String source, String stackTrace);

    PageResponseDTO<SystemLogResponse> searchLogs(
            String level,
            String keyword,
            Instant fromDate,
            Instant toDate,
            int page,
            int size,
            String direction
    );

    int purgeOldLogs(int daysOld);
}
