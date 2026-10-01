package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.ChatRequest;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat-sessions")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final IChatService chatService;

    @PostMapping(value = "/{sessionId}/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID sessionId,
            @RequestBody ChatRequest request) {
            
        log.info("Received chat message for session {} from user {}", sessionId, userPrincipal.getUsers().getId());
        
        return chatService.streamChatWithAI(
                userPrincipal.getUsers().getId(), 
                sessionId, 
                request.getMessage()
        );
    }
}
