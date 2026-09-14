package com.vn.aitutor.security.websocket;

import com.vn.aitutor.security.jwt.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
            log.debug("WebSocket CONNECT attempt. Auth Header: {}", authorizationHeader != null ? "Present" : "Missing");

            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                String token = authorizationHeader.substring(7);
                
                try {
                    // We extract claims directly since we don't have an HttpServletRequest here
                    String username = jwtProvider.getUsernameFromToken(token);
                    String type = jwtProvider.getTypeFromToken(token);
                    
                    if (username != null && "access".equals(type)) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        
                        accessor.setUser(authentication);
                        log.debug("WebSocket connected successfully for user: {}", username);
                    } else {
                        log.error("Invalid JWT type or missing username in token for WebSocket connect");
                        throw new IllegalArgumentException("Token JWT không hợp lệ");
                    }
                } catch (Exception e) {
                    log.error("Failed to authenticate WebSocket connection: {}", e.getMessage());
                    throw new IllegalArgumentException("Xác thực thất bại: " + e.getMessage());
                }
            } else {
                log.error("Missing or invalid Authorization header in WebSocket connect");
                throw new IllegalArgumentException("Thiếu header Authorization");
            }
        }
        
        return message;
    }
}
