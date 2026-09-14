package com.vn.aitutor.security.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
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
    
    // In Spring Security 6, CSRF is disabled globally in SecurityConfig (Http) or via ChannelSecurity. 
    // If you face CSRF token issues, you can explicitly disable it for WebSockets by providing a custom CsrfChannelInterceptor bean.
}
