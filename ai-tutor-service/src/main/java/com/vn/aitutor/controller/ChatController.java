package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.ChatRequest;
import com.vn.aitutor.dto.request.ChatSessionUpdateRequest;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.validation.Valid;

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
            @Valid @RequestBody ChatRequest request) {
            
        log.info("Received chat message for session {} from user {}", sessionId, userPrincipal.getUsers().getId());
        
        return chatService.streamChatWithAI(
                userPrincipal.getUsers().getId(), 
                sessionId, 
                request.getMessage()
        );
    }
    @GetMapping
    public org.springframework.http.ResponseEntity<java.util.List<com.vn.aitutor.dto.response.ChatSessionResponse>> getChatSessions(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return org.springframework.http.ResponseEntity.ok(
                chatService.getChatSessions(userPrincipal.getUsers().getId())
        );
    }

    @GetMapping("/{sessionId}/messages")
    public org.springframework.http.ResponseEntity<java.util.List<com.vn.aitutor.dto.response.ChatMessageResponse>> getChatSessionMessages(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID sessionId) {
        return org.springframework.http.ResponseEntity.ok(
                chatService.getChatSessionMessages(userPrincipal.getUsers().getId(), sessionId)
        );
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<com.vn.aitutor.dto.response.ChatSessionResponse> createChatSession(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "Toán học") String subject) {
        return org.springframework.http.ResponseEntity.ok(
                chatService.createChatSession(userPrincipal.getUsers().getId(), subject)
        );
    }

    @PatchMapping("/{sessionId}")
    public org.springframework.http.ResponseEntity<com.vn.aitutor.dto.response.ChatSessionResponse> renameChatSession(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID sessionId,
            @Valid @RequestBody ChatSessionUpdateRequest request) {
        return org.springframework.http.ResponseEntity.ok(
                chatService.renameChatSession(userPrincipal.getUsers().getId(), sessionId, request.getTitle())
        );
    }

    @DeleteMapping("/{sessionId}")
    public org.springframework.http.ResponseEntity<Void> deleteChatSession(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID sessionId) {
        chatService.deleteChatSession(userPrincipal.getUsers().getId(), sessionId);
        return org.springframework.http.ResponseEntity.noContent().build();
    }
}
