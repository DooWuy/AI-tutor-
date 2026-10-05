package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatSessionResponse {
    private UUID id;
    private String subject;
    private String title;
    private String status;
    private Instant createdAt;
    private Instant lastMessageAt;
}
