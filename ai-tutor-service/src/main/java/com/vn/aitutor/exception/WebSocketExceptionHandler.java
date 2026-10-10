package com.vn.aitutor.exception;

import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

@Component
public class WebSocketExceptionHandler extends StompSubProtocolErrorHandler {

    @Override
    public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable ex) {
        Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
        System.err.println("WebSocket Error: " + cause.getMessage());
        cause.printStackTrace();
        
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.ERROR);
        accessor.setMessage(cause.getMessage());
        accessor.setLeaveMutable(true);

        return MessageBuilder.createMessage(
                cause.getMessage() != null ? cause.getMessage().getBytes() : new byte[0],
                accessor.getMessageHeaders()
        );
    }
}
