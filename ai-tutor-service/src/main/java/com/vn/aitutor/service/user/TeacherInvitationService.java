package com.vn.aitutor.service.user;

import com.vn.aitutor.entity.*;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.repository.*;
import com.vn.aitutor.exception.*;
import com.vn.aitutor.service.system.IMailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeacherInvitationService {
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final IMailService mail;

    @Transactional
    public void resend(UUID id) {
        User u = users.lockById(id).filter(x -> !x.isDeleted() && x.getRole() == Role.TEACHER)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Teacher"));
        if (u.isSetupComplete()) throw new ResourceConflictException("Tài khoản đã thiết lập mật khẩu");
        if (u.getInvitationRequestedAt() != null && u.getInvitationRequestedAt().plusSeconds(60).isAfter(Instant.now()))
            throw new ResourceConflictException("Vui lòng chờ 60 giây trước khi gửi lại");
        tokens.findByUser_IdAndIsUsedFalse(id).forEach(t -> t.setUsed(true));
        tokens.save(PasswordResetToken.builder().user(u).token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusHours(24)).build());
        u.setInvitationStatus("QUEUED"); u.setInvitationRequestedAt(Instant.now());
    }

    // A separate scheduled bean calls this through the transactional proxy. Row lock serializes
    // delivery, resend and setup across instances. Crash before commit retries QUEUED on next scan.
    @Transactional
    public void deliver(UUID id) {
        User u = users.lockById(id).orElse(null);
        if (u == null || u.isDeleted() || !"QUEUED".equals(u.getInvitationStatus())) return;
        var token = tokens.findByUser_IdAndIsUsedFalse(id).stream()
                .filter(t -> t.getExpiryDate().isAfter(LocalDateTime.now())).findFirst();
        if (token.isEmpty()) { u.setInvitationStatus("FAILED"); return; }
        try {
            mail.sendTeacherSetupEmail(u.getEmail(), u.getFullName(), u.getUsername(), token.get().getToken());
            u.setInvitationStatus("SENT");
        } catch (RuntimeException ex) {
            // Persist safe failure state. Explicit resend rotates token and retries without creating a user.
            u.setInvitationStatus("FAILED");
        }
    }
}
