package com.vn.aitutor.security.otp;

import com.vn.aitutor.exception.ResourceBadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class PasswordChangeOtpCache {

    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final int MAX_ATTEMPTS = 3;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ConcurrentHashMap<UUID, OtpEntry> otpStorage = new ConcurrentHashMap<>();

    public String generateOtp(UUID userId) {
        if (userId == null) {
            throw new ResourceBadRequestException("User ID không hợp lệ");
        }

        OtpEntry current = otpStorage.get(userId);
        Instant now = Instant.now();

        if (current != null && now.isBefore(current.lastSentAt().plus(RESEND_COOLDOWN))) {
            long remainingSeconds = Duration.between(now, current.lastSentAt().plus(RESEND_COOLDOWN)).getSeconds();
            throw new ResourceBadRequestException("Vui lòng đợi " + Math.max(remainingSeconds, 1) + " giây trước khi yêu cầu gửi lại mã.");
        }

        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        otpStorage.put(userId, new OtpEntry(otp, now.plus(OTP_TTL), now, new AtomicInteger(MAX_ATTEMPTS)));
        log.info("Đã tạo OTP đổi mật khẩu cho userId: {}", userId);
        return otp;
    }

    public void validateAndConsumeOtp(UUID userId, String submittedOtp) {
        if (userId == null) {
            throw new ResourceBadRequestException("User ID không hợp lệ");
        }
        if (submittedOtp == null || submittedOtp.isBlank()) {
            throw new ResourceBadRequestException("Mã xác nhận không được để trống");
        }

        OtpEntry entry = otpStorage.get(userId);
        Instant now = Instant.now();

        if (entry == null || now.isAfter(entry.expiresAt())) {
            otpStorage.remove(userId);
            throw new ResourceBadRequestException("Mã xác nhận đã hết hạn hoặc chưa được tạo. Vui lòng nhấn gửi mã mới.");
        }

        int remaining = entry.remainingAttempts().decrementAndGet();

        if (!entry.code().equals(submittedOtp.trim())) {
            if (remaining <= 0) {
                otpStorage.remove(userId);
                throw new ResourceBadRequestException("Mã xác nhận không chính xác. Bạn đã hết số lần thử, vui lòng yêu cầu mã mới.");
            }
            throw new ResourceBadRequestException("Mã xác nhận không chính xác. Bạn còn " + remaining + " lần thử.");
        }

        // Hợp lệ -> thu hồi mã (chỉ dùng 1 lần)
        otpStorage.remove(userId);
        log.info("Xác thực OTP đổi mật khẩu thành công cho userId: {}", userId);
    }

    public void clear(UUID userId) {
        if (userId != null) {
            otpStorage.remove(userId);
        }
    }

    public void clearAll() {
        otpStorage.clear();
    }

    private record OtpEntry(
            String code,
            Instant expiresAt,
            Instant lastSentAt,
            AtomicInteger remainingAttempts
    ) {}
}
