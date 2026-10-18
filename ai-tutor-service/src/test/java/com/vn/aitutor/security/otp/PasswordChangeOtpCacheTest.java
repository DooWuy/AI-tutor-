package com.vn.aitutor.security.otp;

import static org.junit.jupiter.api.Assertions.*;

import com.vn.aitutor.exception.ResourceBadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

class PasswordChangeOtpCacheTest {

    private PasswordChangeOtpCache otpCache;
    private UUID userId;

    @BeforeEach
    void setUp() {
        otpCache = new PasswordChangeOtpCache();
        userId = UUID.randomUUID();
    }

    @Test
    void generateOtp_returns6DigitCode() {
        String otp = otpCache.generateOtp(userId);
        assertNotNull(otp);
        assertEquals(6, otp.length());
        assertTrue(otp.matches("^\\d{6}$"));
    }

    @Test
    void generateOtp_cooldownThrowsException() {
        otpCache.generateOtp(userId);
        ResourceBadRequestException ex = assertThrows(ResourceBadRequestException.class, () ->
                otpCache.generateOtp(userId));
        assertTrue(ex.getMessage().contains("Vui lòng đợi"));
    }

    @Test
    void validateAndConsumeOtp_success() {
        String otp = otpCache.generateOtp(userId);
        assertDoesNotThrow(() -> otpCache.validateAndConsumeOtp(userId, otp));

        // Tiếp tục dùng lại mã vừa dùng -> phải báo lỗi vì chỉ dùng 1 lần (single-use)
        assertThrows(ResourceBadRequestException.class, () -> otpCache.validateAndConsumeOtp(userId, otp));
    }

    @Test
    void validateAndConsumeOtp_wrongCode_decrementsAttempts() {
        String otp = otpCache.generateOtp(userId);
        String wrongOtp = otp.equals("123456") ? "654321" : "123456";

        ResourceBadRequestException ex1 = assertThrows(ResourceBadRequestException.class, () ->
                otpCache.validateAndConsumeOtp(userId, wrongOtp));
        assertTrue(ex1.getMessage().contains("còn 2 lần thử"));

        ResourceBadRequestException ex2 = assertThrows(ResourceBadRequestException.class, () ->
                otpCache.validateAndConsumeOtp(userId, wrongOtp));
        assertTrue(ex2.getMessage().contains("còn 1 lần thử"));

        ResourceBadRequestException ex3 = assertThrows(ResourceBadRequestException.class, () ->
                otpCache.validateAndConsumeOtp(userId, wrongOtp));
        assertTrue(ex3.getMessage().contains("hết số lần thử"));
    }

    @Test
    void validateAndConsumeOtp_noOtpGenerated_throwsException() {
        UUID otherId = UUID.randomUUID();
        assertThrows(ResourceBadRequestException.class, () ->
                otpCache.validateAndConsumeOtp(otherId, "123456"));
    }
}
