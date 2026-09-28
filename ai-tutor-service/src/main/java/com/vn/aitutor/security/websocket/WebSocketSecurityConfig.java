package com.vn.aitutor.security.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurityConfig {

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        messages
                .nullDestMatcher().authenticated()
                .simpDestMatchers("/app/**").authenticated()
                .simpSubscribeDestMatchers("/user/**", "/topic/**", "/queue/**").authenticated()
                .anyMessage().denyAll();
                
        return messages.build();
    }

    @Bean(name = "csrfChannelInterceptor")
    ChannelInterceptor csrfChannelInterceptor() {
        // HTTP CSRF is off. This bean replaces the XOR STOMP CSRF check so a cookie session can subscribe.
        return new ChannelInterceptor() {
        };
    }
}
