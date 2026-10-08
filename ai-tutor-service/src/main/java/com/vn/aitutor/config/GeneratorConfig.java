package com.vn.aitutor.config;

import com.vn.aitutor.agent.QuestionGeneratorAgent;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.vn.aitutor.service.impl.CustomPostgresRetriever;

@Configuration
public class GeneratorConfig {

    @Bean
    public QuestionGeneratorAgent questionGeneratorAgent(ChatLanguageModel chatLanguageModel, CustomPostgresRetriever retriever) {
        return AiServices.builder(QuestionGeneratorAgent.class)
                .chatLanguageModel(chatLanguageModel)
                .contentRetriever(retriever)
                .build();
    }
}
