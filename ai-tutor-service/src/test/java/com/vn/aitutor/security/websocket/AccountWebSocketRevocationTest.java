package com.vn.aitutor.security.websocket;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.jwt.JwtProvider;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.messaging.simp.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.simp.user.*;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

class AccountWebSocketRevocationTest {
    @Test void lockedAccountCannotSendOnExistingConnection() {
        var users = mock(UserDetailsService.class);
        when(users.loadUserByUsername("teacher")).thenThrow(new UsernameNotFoundException("disabled"));
        var interceptor = new WebSocketChannelInterceptor(mock(JwtProvider.class), users);
        var headers = StompHeaderAccessor.create(StompCommand.SEND);
        headers.setUser(() -> "teacher");
        assertThrows(UsernameNotFoundException.class, () -> interceptor.preSend(
                MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders()), mock(org.springframework.messaging.MessageChannel.class)));
    }
    @Test @SuppressWarnings("unchecked") void lockedAccountCannotReceiveOnExistingSubscription() {
        var registry = mock(SimpUserRegistry.class);
        var provider = mock(ObjectProvider.class); when(provider.getObject()).thenReturn(registry);
        var user = mock(SimpUser.class); when(user.getName()).thenReturn("teacher");
        when(user.getSession("session")).thenReturn(mock(SimpSession.class));
        when(registry.getUsers()).thenReturn(Set.of(user));
        var users = mock(UserRepository.class);
        when(users.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue("teacher"))
                .thenReturn(Optional.of(new User())).thenReturn(Optional.empty());
        var interceptor = new ActiveAccountOutboundInterceptor(provider, users);
        var headers = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE); headers.setSessionId("session");
        var message = MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
        assertSame(message, interceptor.preSend(message, null));
        assertNull(interceptor.preSend(message, null));
    }
}
