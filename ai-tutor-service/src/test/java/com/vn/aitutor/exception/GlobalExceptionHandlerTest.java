package com.vn.aitutor.exception;

import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.io.UncheckedIOException;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleIllegalArgumentException_returns400WithCleanMessage() {
        var ex = new IllegalArgumentException("Khối lớp không hợp lệ");
        var response = handler.handleIllegalArgumentException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Khối lớp không hợp lệ", response.getBody().getMessage());
    }

    @Test
    void handleIllegalStateException_returns400WithCleanMessage() {
        var ex = new IllegalStateException("Trạng thái đề thi đã đóng");
        var response = handler.handleIllegalStateException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Trạng thái đề thi đã đóng", response.getBody().getMessage());
    }

    @Test
    void handleIngestionException_returns400WithCleanMessage() {
        var ex = new IngestionException("Không thể nhận diện tài liệu OCR");
        var response = handler.handleIngestionException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Không thể nhận diện tài liệu OCR", response.getBody().getMessage());
    }

    @Test
    void handleUncheckedIOException_returns400WithCleanMessage() {
        var ex = new UncheckedIOException("Lỗi đọc file Excel", new IOException("Corrupt zip"));
        var response = handler.handleUncheckedIOException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Lỗi đọc file Excel", response.getBody().getMessage());
    }

    @Test
    void handleRuntimeException_returns500WithoutLeakingJavaClassName() {
        var ex = new RuntimeException("Lỗi tính toán XP");
        var response = handler.handleRuntimeException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Lỗi tính toán XP", response.getBody().getMessage());
        assertFalse(response.getBody().getMessage().contains("java.lang.RuntimeException"));
    }

    @Test
    void handleGeneralException_returns500WithSafeMessage() {
        var ex = new Exception("Internal critical failure");
        var response = handler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Internal critical failure", response.getBody().getMessage());
        assertFalse(response.getBody().getMessage().contains("java.lang.Exception"));
    }

    @Test
    void handleDomainExceptions_returnStandardStatusCodes() {
        assertEquals(HttpStatus.NOT_FOUND, handler.handleNotFound(new ResourceNotFoundException("Not found")).getStatusCode());
        assertEquals(HttpStatus.CONFLICT, handler.handleConflict(new ResourceConflictException("Conflict")).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, handler.handleBadRequest(new ResourceBadRequestException("Bad request")).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, handler.handleForbidden(new ResourceForbiddenException("Forbidden")).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, handler.handleUnauthorized(new ResourceUnauthorizedException("Unauthorized")).getStatusCode());
    }
}
