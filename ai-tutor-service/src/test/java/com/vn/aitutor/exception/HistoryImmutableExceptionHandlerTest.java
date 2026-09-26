package com.vn.aitutor.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

class HistoryImmutableExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void databaseHistoryGuardReturns403() {
        DataIntegrityViolationException error =
                new DataIntegrityViolationException("could not execute", new RuntimeException("ERROR: HISTORY_IMMUTABLE"));

        var response = handler.handleDataAccess(error);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Không được sửa hoặc xóa dữ liệu lịch sử", response.getBody().getMessage());
    }
}
