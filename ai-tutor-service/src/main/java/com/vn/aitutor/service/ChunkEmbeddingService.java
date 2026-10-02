package com.vn.aitutor.service;

import com.vn.aitutor.exception.IngestionException;
import com.vn.aitutor.service.ai.OpenAiEmbeddingClient;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.resilience.annotation.Retryable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChunkEmbeddingService {

    private final OpenAiEmbeddingClient embeddingClient;

    @Retryable(maxRetries = 2, delay = 200, multiplier = 2, includes = IngestionException.class)
    public float[][] embed(List<String> texts) {
        return embeddingClient.embed(texts);
    }
}
