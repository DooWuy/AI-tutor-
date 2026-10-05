package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.exception.IngestionException;
import com.vn.aitutor.service.ai.OpenAiEmbeddingClient;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.resilience.annotation.EnableResilientMethods;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

@SpringJUnitConfig(ChunkEmbeddingRetryTest.RetryConfig.class)
class ChunkEmbeddingRetryTest {

    @Autowired
    private ChunkEmbeddingService embeddingService;

    @Autowired
    private OpenAiEmbeddingClient embeddingClient;

    @BeforeEach
    void resetClient() {
        org.mockito.Mockito.reset(embeddingClient);
    }

    @Test
    void stopsAfterThreeAttemptsWhenEmbeddingKeepsFailing() {
        when(embeddingClient.embed(any())).thenThrow(new IngestionException("hạn mức"));

        assertThrows(IngestionException.class, () -> embeddingService.embed(List.of("đạo hàm")));

        verify(embeddingClient, times(3)).embed(any());
    }

    @Test
    void returnsTheVectorAfterTwoFailedAttempts() {
        float[] vector = new float[OpenAiEmbeddingClient.DIMENSIONS];
        when(embeddingClient.embed(any()))
                .thenThrow(new IngestionException("lần 1"))
                .thenThrow(new IngestionException("lần 2"))
                .thenReturn(new float[][] {vector});

        float[][] embedded = embeddingService.embed(List.of("đạo hàm"));

        assertEquals(OpenAiEmbeddingClient.DIMENSIONS, embedded[0].length);
        verify(embeddingClient, times(3)).embed(any());
    }

    @Configuration
    @EnableResilientMethods(proxyTargetClass = true)
    static class RetryConfig {

        @Bean
        OpenAiEmbeddingClient embeddingClient() {
            return mock(OpenAiEmbeddingClient.class);
        }

        @Bean
        ChunkEmbeddingService embeddingService(OpenAiEmbeddingClient embeddingClient) {
            return new ChunkEmbeddingService(embeddingClient);
        }
    }
}
