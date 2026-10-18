package com.vn.aitutor.service.system;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.system.SystemLogResponse;
import com.vn.aitutor.entity.SystemLog;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.SystemLogRepository;
import com.vn.aitutor.service.system.SystemLogServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class SystemLogServiceImplTest {

    @Mock private SystemLogRepository systemLogRepository;

    private SystemLogServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SystemLogServiceImpl(systemLogRepository);
    }

    @Test
    void log_withThrowable_capturesStackTraceAndSaves() {
        Exception exception = new RuntimeException("Database error");

        service.log("ERROR", "Lỗi truy vấn", "UserService", exception);

        ArgumentCaptor<SystemLog> captor = ArgumentCaptor.forClass(SystemLog.class);
        verify(systemLogRepository).save(captor.capture());

        SystemLog saved = captor.getValue();
        assertEquals("ERROR", saved.getLevel());
        assertEquals("Lỗi truy vấn", saved.getMessage());
        assertEquals("UserService", saved.getSource());
        assertNotNull(saved.getStackTrace());
        assertTrue(saved.getStackTrace().contains("Database error"));
    }

    @Test
    void log_withNulls_defaultsLevelAndMessage() {
        service.log(null, null, "AppSource", (String) null);

        ArgumentCaptor<SystemLog> captor = ArgumentCaptor.forClass(SystemLog.class);
        verify(systemLogRepository).save(captor.capture());

        SystemLog saved = captor.getValue();
        assertEquals("INFO", saved.getLevel());
        assertEquals("No message", saved.getMessage());
        assertEquals("AppSource", saved.getSource());
        assertNull(saved.getStackTrace());
    }

    @Test
    void searchLogs_success() {
        SystemLog logEntry = SystemLog.builder()
                .id(UUID.randomUUID())
                .level("WARN")
                .message("Cảnh báo bảo mật")
                .source("AuthService")
                .createdAt(Instant.now())
                .build();

        Page<SystemLog> paged = new PageImpl<>(List.of(logEntry));
        when(systemLogRepository.searchLogs(eq("WARN"), eq("bảo mật"), any(Instant.class), any(Instant.class), any(Pageable.class)))
                .thenReturn(paged);

        PageResponseDTO<SystemLogResponse> result = service.searchLogs(
                "WARN", "bảo mật", null, null, 1, 10, "DESC"
        );

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("WARN", result.getContent().get(0).getLevel());
        assertEquals("Cảnh báo bảo mật", result.getContent().get(0).getMessage());
    }

    @Test
    void searchLogs_invalidPagination_throwsBadRequest() {
        assertThrows(ResourceBadRequestException.class, () ->
                service.searchLogs("INFO", null, null, null, 0, 10, "DESC"));

        assertThrows(ResourceBadRequestException.class, () ->
                service.searchLogs("INFO", null, null, null, 1, 101, "DESC"));
    }

    @Test
    void purgeOldLogs_success() {
        when(systemLogRepository.purgeLogsOlderThan(any(Instant.class))).thenReturn(42);

        int deleted = service.purgeOldLogs(30);

        assertEquals(42, deleted);
        verify(systemLogRepository).purgeLogsOlderThan(any(Instant.class));
    }
}
