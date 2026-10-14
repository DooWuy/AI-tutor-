package com.vn.aitutor.service.ai;

import com.vn.aitutor.service.ISystemSettingsService;
import lombok.extern.slf4j.Slf4j;

/**
 * Utility to validate and resolve AI model names, API keys, and temperatures for AI services.
 * Automatically harmonizes database setting keys (e.g. 'ai.default_model' vs 'ai.model',
 * 'ai.api_key' vs 'ai.custom_api_key') and translates retired Google Gemini model identifiers.
 */
@Slf4j
public final class AiModelResolver {

    public static final String DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest";

    private AiModelResolver() {}

    /**
     * Resolves and normalizes a Gemini model name. If the requested model is deprecated
     * (e.g. gemini-1.5, gemini-2.5) or an unsupported provider (e.g. ollama, gpt),
     * safely returns the fallback without throwing 404/400 exceptions.
     */
    public static String resolveGeminiModel(String rawModel, String fallback) {
        String safeFallback = (fallback != null && !fallback.isBlank()) ? fallback.trim() : DEFAULT_GEMINI_MODEL;
        if (rawModel == null || rawModel.isBlank()) {
            return safeFallback;
        }
        String model = rawModel.trim().replace("models/", "");
        if (model.startsWith("ollama:") || model.startsWith("gpt-") || model.contains("1.5") || model.contains("2.5")) {
            log.warn("Configured model '{}' is not supported on active Google Gemini endpoints. Falling back to '{}'.",
                    rawModel, safeFallback);
            return safeFallback;
        }
        return model;
    }

    /**
     * Reads configured model from system settings, checking 'ai.default_model' first, then 'ai.model'.
     */
    public static String resolveModel(ISystemSettingsService service, String fallback) {
        String safeFallback = (fallback != null && !fallback.isBlank()) ? fallback.trim() : DEFAULT_GEMINI_MODEL;
        if (service == null) {
            return safeFallback;
        }
        String raw = service.getSetting("ai.default_model", null);
        if (raw == null || raw.isBlank()) {
            raw = service.getSetting("ai.model", null);
        }
        return resolveGeminiModel(raw, safeFallback);
    }

    /**
     * Reads custom API key from system settings ('ai.api_key' or 'ai.custom_api_key').
     * If neither is set, returns defaultKey.
     */
    public static String resolveApiKey(ISystemSettingsService service, String defaultKey) {
        if (service == null) {
            return defaultKey;
        }
        String custom = service.getSetting("ai.api_key", null);
        if (custom == null || custom.isBlank()) {
            custom = service.getSetting("ai.custom_api_key", null);
        }
        if (custom != null && !custom.isBlank()) {
            return custom.trim();
        }
        return defaultKey;
    }

    /**
     * Reads configured temperature from system settings ('ai.temperature').
     */
    public static double resolveTemperature(ISystemSettingsService service, double defaultTemp) {
        if (service == null) {
            return defaultTemp;
        }
        return service.getDouble("ai.temperature", defaultTemp);
    }
}
