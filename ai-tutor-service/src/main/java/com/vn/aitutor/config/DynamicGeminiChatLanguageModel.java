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
            String keyToUse = (effectiveKey == null || effectiveKey.isBlank()) ? "DUMMY_KEY_NOT_CONFIGURED" : effectiveKey;
            this.delegate = GoogleAiGeminiChatModel.builder()
                    .apiKey(keyToUse)
                    .modelName(effectiveModel)
                    .temperature(effectiveTemp)
                    .timeout(Duration.ofMinutes(2))
                    .build();
        }
    }

    private boolean isTransientOverload(Throwable t) {
        if (t == null || t.getMessage() == null) return false;
        String m = t.getMessage().toLowerCase();
        return m.contains("503") || m.contains("unavailable") || m.contains("demand") || m.contains("overloaded");
    }

    private ChatLanguageModel createFallbackModel() {
        String keyToUse = (cachedKey == null || cachedKey.isBlank()) ? "DUMMY_KEY_NOT_CONFIGURED" : cachedKey;
        return GoogleAiGeminiChatModel.builder()
                .apiKey(keyToUse)
                .modelName(AiModelResolver.DEFAULT_GEMINI_MODEL)
                .temperature(cachedTemp)
                .timeout(Duration.ofMinutes(2))
                .build();
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages) {
        try {
            return getDelegate().generate(messages);
        } catch (RuntimeException ex) {
            if (isTransientOverload(ex) && !AiModelResolver.DEFAULT_GEMINI_MODEL.equals(cachedModel)) {
                log.warn("Model '{}' is temporarily unavailable. Falling back to '{}'.",
                        cachedModel, AiModelResolver.DEFAULT_GEMINI_MODEL);
                return createFallbackModel().generate(messages);
            }
            throw ex;
        }
    }

    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages, List<ToolSpecification> toolSpecifications) {
        try {
            return getDelegate().generate(messages, toolSpecifications);
        } catch (RuntimeException ex) {
            if (isTransientOverload(ex) && !AiModelResolver.DEFAULT_GEMINI_MODEL.equals(cachedModel)) {
                log.warn("Model '{}' is temporarily unavailable. Falling back to '{}'.",
                        cachedModel, AiModelResolver.DEFAULT_GEMINI_MODEL);
                return createFallbackModel().generate(messages, toolSpecifications);
            }
            throw ex;
        }
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
