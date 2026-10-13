package com.vn.aitutor.config;

import com.vn.aitutor.service.ISystemSettingsService;
import com.vn.aitutor.service.ai.AiModelResolver;
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.Capability;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.output.Response;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;

/**
 * Dynamic ChatLanguageModel wrapper that automatically refreshes the underlying
 * GoogleAiGeminiChatModel whenever system settings (ai.model, ai.temperature, ai.custom_api_key) change.
 */
@Slf4j
public class DynamicGeminiChatLanguageModel implements ChatLanguageModel {

    private final String defaultApiKey;
    private final ISystemSettingsService systemSettingsService;
    private volatile ChatLanguageModel delegate;
    private volatile String cachedModel;
    private volatile double cachedTemp;
    private volatile String cachedKey;

    public DynamicGeminiChatLanguageModel(String defaultApiKey, ISystemSettingsService systemSettingsService) {
        this.defaultApiKey = defaultApiKey == null ? "" : defaultApiKey.trim();
        this.systemSettingsService = systemSettingsService;
        refreshDelegateIfNeeded();
    }

    private synchronized ChatLanguageModel getDelegate() {
        refreshDelegateIfNeeded();
        return delegate;
    }

    private void refreshDelegateIfNeeded() {
        String effectiveKey = AiModelResolver.resolveApiKey(systemSettingsService, defaultApiKey);
        String effectiveModel = AiModelResolver.resolveModel(systemSettingsService, AiModelResolver.DEFAULT_GEMINI_MODEL);
        double effectiveTemp = AiModelResolver.resolveTemperature(systemSettingsService, 0.3);

        if (delegate == null || !effectiveModel.equals(cachedModel) || Math.abs(effectiveTemp - cachedTemp) > 0.001 || !effectiveKey.equals(cachedKey)) {
            log.info("Applying dynamic Gemini model: model={}, temperature={}", effectiveModel, effectiveTemp);
            this.cachedModel = effectiveModel;
            this.cachedTemp = effectiveTemp;
            this.cachedKey = effectiveKey;
            this.delegate = GoogleAiGeminiChatModel.builder()
                    .apiKey(effectiveKey)
                    .modelName(effectiveModel)
                    .temperature(effectiveTemp)
                    .timeout(Duration.ofMinutes(2))
                    .build();
        }
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages) {
        return getDelegate().generate(messages);
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, List<ToolSpecification> toolSpecifications) {
        return getDelegate().generate(messages, toolSpecifications);
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, ToolSpecification toolSpecification) {
        return getDelegate().generate(messages, toolSpecification);
    }

    @Override
    public String generate(String userMessage) {
        return getDelegate().generate(userMessage);
    }

    @Override
    public Response<AiMessage> generate(ChatMessage... messages) {
        return getDelegate().generate(messages);
    }

    @Override
    public ChatResponse chat(ChatRequest request) {
        return getDelegate().chat(request);
    }

    @Override
    public Set<Capability> supportedCapabilities() {
        return getDelegate().supportedCapabilities();
    }
}
