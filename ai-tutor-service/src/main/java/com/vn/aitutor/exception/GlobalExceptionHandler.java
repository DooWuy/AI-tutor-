package com.vn.aitutor.exception;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.service.system.ISystemLogService;
import io.jsonwebtoken.JwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.io.UncheckedIOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired(required = false)
    private ISystemLogService systemLogService;

    public GlobalExceptionHandler() {
    }

    public GlobalExceptionHandler(ISystemLogService systemLogService) {
        this.systemLogService = systemLogService;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<String>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(ResourceConflictException.class)
    public ResponseEntity<ApiResponse<String>> handleConflict(ResourceConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(ResourceBadRequestException.class)
    public ResponseEntity<ApiResponse<String>> handleBadRequest(ResourceBadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(ResourceForbiddenException.class)
    public ResponseEntity<ApiResponse<String>> handleForbidden(ResourceForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(ResourceUnauthorizedException.class)
    public ResponseEntity<ApiResponse<String>> handleUnauthorized(ResourceUnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .build());
    }

    // Xử lý Validation @Valid
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(false)
                        .message("Lỗi xác thực dữ liệu")
                        .error(errors)
                        .build());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<String>> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message("Email hoặc mật khẩu không chính xác")
                        .build());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<String>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message("Bạn không có quyền truy cập tài nguyên này")
                        .build());
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ApiResponse<String>> handleJwtException(JwtException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message("Token không hợp lệ hoặc đã hết hạn")
                        .build());
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiResponse<String>> handleDataAccess(DataAccessException ex) {
        if (historyImmutable(ex)) {
            log.warn("History mutation blocked by database: {}", rootMessage(ex));
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.<String>builder()
                            .success(false)
                            .message("Không được sửa hoặc xóa dữ liệu lịch sử")
                            .build());
        }
        log.error("Database error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(ex.getMessage() + (ex.getCause() != null ? " - " + ex.getCause().getMessage() : ""))
                        .build());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<String>> handleMissingParams(MissingServletRequestParameterException ex) {
        String name = ex.getParameterName();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message("Thiếu tham số bắt buộc: " + name)
                        .build());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<String>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String name = ex.getName();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message("Tham số không hợp lệ: " + name)
                        .build());
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<ApiResponse<String>> handleUnavailable(ServiceUnavailableException ex) {
        log.warn("Service unavailable: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<String>> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message("Dung lượng file vượt quá giới hạn cho phép")
                        .build());
    }

    private boolean historyImmutable(Throwable error) {
        Throwable current = error;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && message.contains("HISTORY_IMMUTABLE")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private String rootMessage(Throwable error) {
        Throwable current = error;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current.getMessage();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Lỗi tham số không hợp lệ (IllegalArgumentException): {}", ex.getMessage());
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Dữ liệu yêu cầu không hợp lệ";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(msg)
                        .build());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<String>> handleIllegalStateException(IllegalStateException ex) {
        log.warn("Trạng thái yêu cầu không hợp lệ (IllegalStateException): {}", ex.getMessage());
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Trạng thái hệ thống hoặc yêu cầu không hợp lệ";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(msg)
                        .build());
    }

    @ExceptionHandler(IngestionException.class)
    public ResponseEntity<ApiResponse<String>> handleIngestionException(IngestionException ex) {
        log.error("Lỗi nạp hoặc xử lý tài liệu (IngestionException): {}", ex.getMessage(), ex);
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Lỗi trong quá trình xử lý và bóc tách tài liệu";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(msg)
                        .build());
    }

    @ExceptionHandler(UncheckedIOException.class)
    public ResponseEntity<ApiResponse<String>> handleUncheckedIOException(UncheckedIOException ex) {
        log.error("Lỗi đọc/ghi tập tin (UncheckedIOException): {}", ex.getMessage(), ex);
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Không thể xử lý tập tin được yêu cầu";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(msg)
                        .build());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<String>> handleRuntimeException(RuntimeException ex) {
        log.error("Lỗi runtime hệ thống (RuntimeException): {}", ex.getMessage(), ex);
        if (systemLogService != null) {
            try {
                systemLogService.log("ERROR", ex.getMessage() != null ? ex.getMessage() : ex.toString(), ex.getClass().getSimpleName(), ex);
            } catch (Exception ignored) {
                // Avoid failing exception handler if logging fails
            }
        }
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Đã xảy ra lỗi runtime trong quá trình xử lý";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(msg)
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleGeneralException(Exception ex) {
        log.error("Unhandled exception caught in GlobalExceptionHandler", ex);
        if (systemLogService != null) {
            try {
                systemLogService.log("ERROR", ex.getMessage() != null ? ex.getMessage() : ex.toString(), ex.getClass().getSimpleName(), ex);
            } catch (Exception ignored) {
                // Avoid failing exception handler if logging fails
            }
        }
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Hệ thống gặp sự cố không mong muốn. Vui lòng thử lại sau.";
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<String>builder()
                        .success(false)
                        .message(msg)
                        .build());
    }
}
