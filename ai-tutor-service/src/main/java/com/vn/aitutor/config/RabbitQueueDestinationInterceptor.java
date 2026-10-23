package com.vn.aitutor.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;

/** Encode nested queue names after Spring resolves personal destinations, before RabbitMQ STOMP. */
final class RabbitQueueDestinationInterceptor implements ChannelInterceptor {
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        String destination = SimpMessageHeaderAccessor.getDestination(message.getHeaders());
        if (destination == null || !destination.startsWith("/queue/chat-sessions/")) return message;
        // Preserve SIMP server messages: the relay creates their STOMP SEND frame itself.
        // Giving it an immutable STOMP accessor without a command prevents that conversion.
        SimpMessageHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class) != null
                ? StompHeaderAccessor.wrap(message) : SimpMessageHeaderAccessor.wrap(message);
        // RabbitMQ accepts /queue/{name}; literal slashes inside {name} must be escaped.
        accessor.setDestination("/queue/" + destination.substring("/queue/".length()).replace("/", "%2F"));
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    }
}
