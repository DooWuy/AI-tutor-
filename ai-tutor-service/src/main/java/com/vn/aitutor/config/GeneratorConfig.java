package com.vn.aitutor.config;

import com.vn.aitutor.ai.agent.GeminiQuestionGeneratorAgent;
import com.vn.aitutor.ai.agent.QuestionGeneratorAgent;
import com.vn.aitutor.service.system.ISystemSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeneratorConfig {

    @Bean
    public QuestionGeneratorAgent questionGeneratorAgent(
            @Value("${gemini.api.key:}") String geminiApiKey,
            @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent}")
                    String geminiApiUrl,
            @Autowired(required = false) ISystemSettingsService systemSettingsService) {
        return new GeminiQuestionGeneratorAgent(geminiApiKey, geminiApiUrl, systemSettingsService);
    }
}
