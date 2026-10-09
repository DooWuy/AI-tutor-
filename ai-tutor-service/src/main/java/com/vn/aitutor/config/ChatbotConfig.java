package com.vn.aitutor.config;

import com.vn.aitutor.agent.AiTutorChatAgent;
import com.vn.aitutor.service.impl.CustomPostgresRetriever;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.service.AiServices;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatbotConfig {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Bean
    public ChatLanguageModel geminiChatModel() {
        return GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName("gemini-3.5-flash-lite")
                .temperature(0.3)
                .timeout(Duration.ofMinutes(2))
                .build();
    }

    @Bean
    public AiTutorChatAgent aiTutorChatAgent(ChatLanguageModel chatLanguageModel, CustomPostgresRetriever retriever) {
        return AiServices.builder(AiTutorChatAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(20))
                .contentRetriever(retriever)
                .build();
    }
}
