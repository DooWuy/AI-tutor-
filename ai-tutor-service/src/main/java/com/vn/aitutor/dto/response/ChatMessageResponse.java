package com.vn.aitutor.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatMessageResponse {
    private UUID id;
    private String senderType;
    private String content;
    private String audioUrl;
    private String intent;
    private List<Map<String, Object>> citationLinks;
    private Instant createdAt;
}
