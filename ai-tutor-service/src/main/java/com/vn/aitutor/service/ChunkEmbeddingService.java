package com.vn.aitutor.service;

import com.vn.aitutor.exception.IngestionException;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.data.segment.TextSegment;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.resilience.annotation.Retryable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChunkEmbeddingService {

    private final EmbeddingModel embeddingModel;

    @Retryable(maxRetries = 2, delay = 200, multiplier = 2, includes = IngestionException.class)
    public float[][] embed(List<String> texts) {
        try {
            List<TextSegment> segments = texts.stream()
                .map(TextSegment::from)
                .collect(Collectors.toList());
            
            var response = embeddingModel.embedAll(segments).content();
            float[][] result = new float[response.size()][];
            for (int i = 0; i < response.size(); i++) {
                result[i] = response.get(i).vector();
            }
            return result;
        } catch (Exception e) {
            throw new IngestionException("Error generating embeddings", e);
        }
    }
}
