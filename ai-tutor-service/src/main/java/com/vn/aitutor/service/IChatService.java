package com.vn.aitutor.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.vn.aitutor.dto.response.ChatSessionResponse;
import com.vn.aitutor.dto.response.ChatMessageResponse;
import java.util.UUID;
import java.util.List;

public interface IChatService {
    /**
     * Start a streaming chat response with the AI using RAG.
     * @param studentId the ID of the student
     * @param sessionId the ID of the chat session
     * @param userMessage the message from the user
     * @return an SseEmitter to push events to the client
     */
    SseEmitter streamChatWithAI(UUID studentId, UUID sessionId, String userMessage);

    void streamChatOverWebSocket(UUID userId, UUID sessionId, String username, String userMessage);

    /**
     * Lấy danh sách các phiên trò chuyện của học sinh, sắp xếp phiên mới nhất lên đầu.
     */
    List<ChatSessionResponse> getChatSessions(UUID studentId);

    /**
     * Lấy toàn bộ lịch sử tin nhắn của một phiên chat cụ thể.
     */
    List<ChatMessageResponse> getChatSessionMessages(UUID studentId, UUID sessionId);

    /**
     * Tạo một phiên trò chuyện mới.
     */
    ChatSessionResponse createChatSession(UUID studentId, String subject);

    ChatSessionResponse renameChatSession(UUID studentId, UUID sessionId, String title);

    void deleteChatSession(UUID studentId, UUID sessionId);
}
