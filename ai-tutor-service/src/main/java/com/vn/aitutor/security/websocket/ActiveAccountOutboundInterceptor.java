package com.vn.aitutor.security.websocket;

import com.vn.aitutor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

/** Suppress delivery to existing subscriptions after the account is locked or deleted. */
@Component
@RequiredArgsConstructor
public class ActiveAccountOutboundInterceptor implements ChannelInterceptor {
    private final org.springframework.beans.factory.ObjectProvider<SimpUserRegistry> registry;
    private final UserRepository users;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        if (SimpMessageHeaderAccessor.getMessageType(message.getHeaders()) != SimpMessageType.MESSAGE) return message;
        String session = SimpMessageHeaderAccessor.getSessionId(message.getHeaders());
        if (session == null) return null;
        return registry.getObject().getUsers().stream().filter(user -> user.getSession(session) != null)
                .findFirst().filter(user -> users.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(user.getName()).isPresent())
                .map(user -> message).orElse(null);
    }
}
