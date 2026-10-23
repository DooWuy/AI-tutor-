package com.vn.aitutor.security.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.simp.SimpMessageType;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocketSecurity
@RequiredArgsConstructor
public class WebSocketSecurityConfig {
    private final OwnedChatDestinationAuthorization ownedChatDestination;

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        messages
                .simpTypeMatchers(SimpMessageType.CONNECT, SimpMessageType.DISCONNECT,
                        SimpMessageType.UNSUBSCRIBE, SimpMessageType.HEARTBEAT).authenticated()
                .simpSubscribeDestMatchers("/user/queue/notifications").authenticated()
                .simpSubscribeDestMatchers("/user/queue/chat-sessions/*/stream").access(ownedChatDestination)
                .simpTypeMatchers(SimpMessageType.SUBSCRIBE).denyAll()
                .simpDestMatchers("/app/chat-sessions/*/messages").access(ownedChatDestination)
                .anyMessage().denyAll();
                
        return messages.build();
    }
    
    // In Spring Security 6, CSRF is disabled globally in SecurityConfig (Http) or via ChannelSecurity. 
    // We explicitly disable it for WebSockets by providing a custom no-op CsrfChannelInterceptor bean.
    @Bean(name = "csrfChannelInterceptor")
    public ChannelInterceptor csrfChannelInterceptor() {
        return new ChannelInterceptor() {
        };
    }
}
