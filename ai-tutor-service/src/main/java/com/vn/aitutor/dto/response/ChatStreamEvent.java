package com.vn.aitutor.dto.response;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatStreamEvent {

    private String type;
    private String content;
    private String message;
    private List<Map<String, Object>> citations;

    public static ChatStreamEvent token(String content) {
        return ChatStreamEvent.builder().type("token").content(content).build();
    }

    public static ChatStreamEvent citations(List<Map<String, Object>> citations) {
        return ChatStreamEvent.builder().type("citations").citations(citations).build();
    }

    public static ChatStreamEvent done() {
        return ChatStreamEvent.builder().type("done").build();
    }

    public static ChatStreamEvent error(String message) {
        return ChatStreamEvent.builder().type("error").message(message).build();
    }
}
