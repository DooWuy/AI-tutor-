package com.vn.aitutor.security.websocket;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.security.jwt.JwtProvider;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class WebSocketChannelInterceptorTest {

    @Mock private JwtProvider jwtProvider;
    @Mock private UserDetailsService userDetailsService;

    private WebSocketChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new WebSocketChannelInterceptor(jwtProvider, userDetailsService);
    }

    @Test
    void accessTokenCreatesAuthenticatedPrincipal() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("student-one");
        UserPrincipal principal = UserPrincipal.builder().users(user).build();
        when(jwtProvider.getUsernameFromToken("access-token")).thenReturn("student-one");
        when(jwtProvider.getTypeFromToken("access-token")).thenReturn("access");
        when(userDetailsService.loadUserByUsername("student-one")).thenReturn(principal);

        Message<?> result = interceptor.preSend(connectMessage("access-token"), null);

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);
        assertTrue(accessor.getUser() != null);
        assertTrue(((Authentication) accessor.getUser()).isAuthenticated());
    }

    @Test
    void refreshTokenIsRejected() {
        when(jwtProvider.getUsernameFromToken("refresh-token")).thenReturn("student-one");
        when(jwtProvider.getTypeFromToken("refresh-token")).thenReturn("refresh");

        assertThrows(IllegalArgumentException.class,
                () -> interceptor.preSend(connectMessage("refresh-token"), null));
    }

    @Test
    void missingAuthorizationIsRejected() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(IllegalArgumentException.class,
                () -> interceptor.preSend(message, null));
    }

    private static Message<byte[]> connectMessage(String token) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + token);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
