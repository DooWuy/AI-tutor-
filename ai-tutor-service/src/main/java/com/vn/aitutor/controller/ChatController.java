package com.vn.aitutor.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@Slf4j
public class ChatController {

    /**
     * Nhận message từ client gửi lên kênh /app/chat.sendMessage
     * Sau đó phát (broadcast) tới tất cả những ai đang lắng nghe kênh /topic/public
     */
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public String sendMessage(@Payload String chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        Principal user = headerAccessor.getUser();
        String username = (user != null) ? user.getName() : "Anonymous";
        
        log.info("Received message from user {}: {}", username, chatMessage);
        
        // Format lại message để gửi đi
        return username + ": " + chatMessage;
    }
}
