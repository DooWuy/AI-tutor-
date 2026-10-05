package com.vn.aitutor.service.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vn.aitutor.exception.IngestionException;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class OpenAiEmbeddingClientTest {

    @Test
    void requestBodyUsesTheSmallEmbeddingModel() {
        Map<String, Object> body = OpenAiEmbeddingClient.requestBody(
                OpenAiEmbeddingClient.DEFAULT_MODEL, List.of("đạo hàm"));

        assertEquals("text-embedding-3-small", body.get("model"));
        assertEquals(List.of("đạo hàm"), body.get("input"));
        assertEquals(1536, OpenAiEmbeddingClient.DIMENSIONS);
    }

    @Test
    void missingApiKeyFailsBeforeAnyNetworkCall() {
        OpenAiEmbeddingClient client = new OpenAiEmbeddingClient("", "text-embedding-3-small", "https://api.openai.com/v1/embeddings");

        IngestionException error = assertThrows(IngestionException.class, () -> client.embed(List.of("x")));
        assertEquals("Thiếu OPENAI_API_KEY", error.getMessage());
    }
}
