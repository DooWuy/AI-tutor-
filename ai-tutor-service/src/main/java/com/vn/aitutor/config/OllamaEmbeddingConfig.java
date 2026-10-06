package com.vn.aitutor.config;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ollama.OllamaEmbeddingModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class OllamaEmbeddingConfig {

    @Value("${langchain4j.ollama.embedding-model.base-url}")
    private String baseUrl;

    @Value("${langchain4j.ollama.embedding-model.model-name}")
    private String modelName;

    @Bean
    public EmbeddingModel ollamaEmbeddingModel() {
        return OllamaEmbeddingModel.builder()
                .baseUrl(baseUrl)
                .modelName(modelName)
                .timeout(Duration.ofMinutes(2))
                .build();
    }
}
