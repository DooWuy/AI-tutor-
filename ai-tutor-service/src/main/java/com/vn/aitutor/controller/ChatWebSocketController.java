package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.ChatStreamRequest;
import com.vn.aitutor.exception.ResourceUnauthorizedException;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IChatService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final IChatService chatService;

    @MessageMapping("/chat-sessions/{sessionId}/messages")
    public void sendMessage(
            @DestinationVariable UUID sessionId,
            @Valid @Payload ChatStreamRequest request,
            Principal principal) {
        if (!(principal instanceof Authentication authentication)
                || !(authentication.getPrincipal() instanceof UserPrincipal userPrincipal)
                || userPrincipal.getUsers() == null) {
            throw new ResourceUnauthorizedException("Xác thực WebSocket thất bại");
        }

        chatService.streamChatOverWebSocket(
                userPrincipal.getUsers().getId(),
                sessionId,
                principal.getName(),
                request.getMessage());
    }
}
