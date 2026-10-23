package com.vn.aitutor.security.websocket;

import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.messaging.access.intercept.MessageAuthorizationContext;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OwnedChatDestinationAuthorization implements AuthorizationManager<MessageAuthorizationContext<?>> {
    private static final String UUID_PATTERN = "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})";
    private static final Pattern DESTINATION = Pattern.compile(
            "^(?:/user/queue/chat-sessions/" + UUID_PATTERN + "/stream|/app/chat-sessions/" + UUID_PATTERN + "/messages)$");
    private final ChatSessionRepository sessions;

    @Override
    public AuthorizationDecision authorize(Supplier<? extends Authentication> authentication, MessageAuthorizationContext<?> context) {
        Message<?> message = context.getMessage();
        Authentication auth = authentication.get();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal user)
                || !user.isEnabled() || user.getUsers().getId() == null) return new AuthorizationDecision(false);
        String destination = SimpMessageHeaderAccessor.getDestination(message.getHeaders());
        var match = DESTINATION.matcher(destination == null ? "" : destination);
        if (!match.matches()) return new AuthorizationDecision(false);
        UUID sessionId = UUID.fromString(match.group(1) != null ? match.group(1) : match.group(2));
        return new AuthorizationDecision(sessions.existsByIdAndStudent_User_Id(sessionId, user.getUsers().getId()));
    }
}
