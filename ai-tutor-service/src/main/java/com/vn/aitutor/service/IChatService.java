package com.vn.aitutor.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.UUID;

public interface IChatService {
    /**
     * Start a streaming chat response with the AI using RAG.
     * @param studentId the ID of the student
     * @param sessionId the ID of the chat session
     * @param userMessage the message from the user
     * @return an SseEmitter to push events to the client
     */
    SseEmitter streamChatWithAI(UUID studentId, UUID sessionId, String userMessage);
}
