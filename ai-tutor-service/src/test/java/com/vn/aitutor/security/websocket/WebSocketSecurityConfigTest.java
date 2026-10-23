package com.vn.aitutor.security.websocket;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

class WebSocketSecurityConfigTest {
    private final ChatSessionRepository sessions = mock(ChatSessionRepository.class);
    private final AuthorizationManager<Message<?>> manager = new WebSocketSecurityConfig(new OwnedChatDestinationAuthorization(sessions))
            .messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.builder());
    private final UUID userId = UUID.randomUUID(), sessionId = UUID.randomUUID();

    private Authentication user() {
        var user = new User(); user.setId(userId); user.setUsername("student");
        return new UsernamePasswordAuthenticationToken(UserPrincipal.builder().users(user).build(), null, List.of());
    }
    private boolean allows(Authentication auth, SimpMessageType type, String destination) {
        var headers = SimpMessageHeaderAccessor.create(type);
        if (destination != null) headers.setDestination(destination);
        var decision = manager.authorize(() -> auth, MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders()));
        return decision != null && decision.isGranted();
    }

    @Test void onlyThePersonalNotificationSubscriptionIsAllowed() {
        assertTrue(allows(user(), SimpMessageType.SUBSCRIBE, "/user/queue/notifications"));
        for (String path : List.of("/queue/notifications", "/topic/notifications", "/queue/notifications-user123",
                "/user/another-user/queue/notifications", "/user/queue/notifications/extra", "/app/unknown")) {
            assertFalse(allows(user(), SimpMessageType.SUBSCRIBE, path), path);
        }
        assertFalse(allows(null, SimpMessageType.SUBSCRIBE, "/user/queue/notifications"));
        assertFalse(allows(user(), SimpMessageType.MESSAGE, "/user/queue/notifications"));
        verifyNoInteractions(sessions);
    }

    @Test void chatStreamsAndMessagesRequireAnOwnedSessionAndExactShape() {
        when(sessions.existsByIdAndStudent_User_Id(sessionId, userId)).thenReturn(true);
        assertTrue(allows(user(), SimpMessageType.SUBSCRIBE, "/user/queue/chat-sessions/" + sessionId + "/stream"));
        assertTrue(allows(user(), SimpMessageType.MESSAGE, "/app/chat-sessions/" + sessionId + "/messages"));
        assertFalse(allows(user(), SimpMessageType.SUBSCRIBE, "/app/chat-sessions/" + sessionId + "/messages"));
        assertFalse(allows(user(), SimpMessageType.MESSAGE, "/app/anything"));
        assertFalse(allows(user(), SimpMessageType.SUBSCRIBE, "/user/queue/chat-sessions/not-a-uuid/stream"));
        assertFalse(allows(user(), SimpMessageType.SUBSCRIBE, "/user/queue/chat-sessions/" + UUID.randomUUID() + "/stream"));
    }

    @Test void controlFramesRequireAuthenticationAndEmptyMessagesAreNotAllowed() {
        for (var type : List.of(SimpMessageType.CONNECT, SimpMessageType.DISCONNECT, SimpMessageType.UNSUBSCRIBE, SimpMessageType.HEARTBEAT)) {
            assertTrue(allows(user(), type, null));
            assertFalse(allows(null, type, null));
        }
        assertFalse(allows(user(), SimpMessageType.MESSAGE, null));
        assertFalse(allows(user(), SimpMessageType.SUBSCRIBE, null));
    }
}
