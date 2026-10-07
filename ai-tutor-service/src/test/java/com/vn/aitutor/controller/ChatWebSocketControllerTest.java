package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;

import com.vn.aitutor.dto.request.ChatStreamRequest;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.exception.ResourceUnauthorizedException;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IChatService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketControllerTest {

    @Mock private IChatService chatService;

    @Test
    void forwardsMessageUsingAuthenticatedPrincipal() {
        ChatWebSocketController controller = new ChatWebSocketController(chatService);
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setUsername("student-one");
        UserPrincipal userPrincipal = UserPrincipal.builder().users(user).build();
        UsernamePasswordAuthenticationToken principal =
                new UsernamePasswordAuthenticationToken(userPrincipal, null);
        ChatStreamRequest request = new ChatStreamRequest();
        request.setMessage("  Giải thích đạo hàm  ");

        controller.sendMessage(sessionId, request, principal);

        verify(chatService).streamChatOverWebSocket(
                userId, sessionId, "student-one", "  Giải thích đạo hàm  ");
    }

    @Test
    void rejectsMissingPrincipal() {
        ChatWebSocketController controller = new ChatWebSocketController(chatService);
        ChatStreamRequest request = new ChatStreamRequest();
        request.setMessage("Câu hỏi");

        assertThrows(ResourceUnauthorizedException.class,
                () -> controller.sendMessage(UUID.randomUUID(), request, null));
    }
}
