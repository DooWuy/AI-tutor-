package com.vn.aitutor.config;

import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.user.TeacherInvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TeacherInvitationJob {
    private final UserRepository users;
    private final TeacherInvitationService invitations;
    @Scheduled(fixedDelayString="${app.invitation.scan-ms:10000}")
    public void sendQueued() {
        users.findTop50ByInvitationStatusAndIsDeletedFalseOrderByInvitationRequestedAtAsc("QUEUED")
                .forEach(u -> invitations.deliver(u.getId()));
    }
}
