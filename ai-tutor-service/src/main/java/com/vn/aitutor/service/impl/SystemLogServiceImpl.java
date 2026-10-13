package com.vn.aitutor.service.impl;

import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.SystemLogResponse;
import com.vn.aitutor.entity.SystemLog;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.SystemLogRepository;
import com.vn.aitutor.service.ISystemLogService;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemLogServiceImpl implements ISystemLogService {

    private final SystemLogRepository systemLogRepository;

    @Override
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String level, String message, String source, Throwable throwable) {
        String stackTrace = null;
        if (throwable != null) {
            StringWriter sw = new StringWriter();
            throwable.printStackTrace(new PrintWriter(sw));
            stackTrace = sw.toString();
        }
        log(level, message, source, stackTrace);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String level, String message, String source, String stackTrace) {
        try {
            SystemLog entry = SystemLog.builder()
                    .level(level != null ? level.toUpperCase() : "INFO")
                    .message(message != null ? message : "No message")
                    .source(source)
                    .stackTrace(stackTrace)
                    .build();
            systemLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to write system log to database: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<SystemLogResponse> searchLogs(
            String level,
            String keyword,
            Instant fromDate,
            Instant toDate,
            int page,
            int size,
            String direction
    ) {
        if (page < 1 || size < 1 || size > 100) {
            throw new ResourceBadRequestException("page phải >= 1 và size phải từ 1 đến 100");
        }
        Sort.Direction sortDirection;
        try {
            sortDirection = Sort.Direction.fromString(direction);
        } catch (IllegalArgumentException e) {
            sortDirection = Sort.Direction.DESC;
        }

        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(sortDirection, "createdAt"));
        Page<SystemLog> paged = systemLogRepository.searchLogs(
                (level == null || level.isBlank()) ? null : level.trim().toUpperCase(),
                (keyword == null || keyword.isBlank()) ? null : keyword.trim(),
                fromDate,
                toDate,
                pageRequest
        );

        List<SystemLogResponse> content = paged.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponseDTO.<SystemLogResponse>builder()
                .page(page)
                .size(size)
                .totalElements(paged.getTotalElements())
                .totalPages(paged.getTotalPages())
                .content(content)
                .hasNext(paged.hasNext())
                .hasPrevious(paged.hasPrevious())
                .build();
    }

    @Override
    @Transactional
    public int purgeOldLogs(int daysOld) {
        if (daysOld < 1) daysOld = 30;
        Instant cutoff = Instant.now().minus(daysOld, ChronoUnit.DAYS);
        int deleted = systemLogRepository.purgeLogsOlderThan(cutoff);
        log.info("Purged {} system logs older than {} days", deleted, daysOld);
        return deleted;
    }

    private SystemLogResponse toResponse(SystemLog systemLog) {
        return SystemLogResponse.builder()
                .id(systemLog.getId())
                .level(systemLog.getLevel())
                .message(systemLog.getMessage())
                .source(systemLog.getSource())
                .stackTrace(systemLog.getStackTrace())
                .createdAt(systemLog.getCreatedAt())
                .build();
    }
}
