package com.vn.aitutor.ai.client;

import com.vn.aitutor.ai.resolver.AiModelResolver;
import com.vn.aitutor.exception.ServiceUnavailableException;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import com.vn.aitutor.service.system.ISystemSettingsService;
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
@Component
public class GeminiQuestionClient {

    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final RestTemplate restTemplate;
    private final JsonMapper objectMapper;
    private final String defaultApiKey;
    private final String defaultModel;
    private final ISystemSettingsService systemSettingsService;

    @Autowired
    public GeminiQuestionClient(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.question.model:gemini-3.5-flash-lite}") String model,
            @Autowired(required = false) ISystemSettingsService systemSettingsService) {
        this.defaultApiKey = apiKey == null ? "" : apiKey.trim();
        this.defaultModel = (model == null || model.isBlank()) ? "gemini-3.5-flash-lite" : model.trim();
        this.systemSettingsService = systemSettingsService;
        this.objectMapper = JsonMapper.builder().build();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(120_000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String complete(String prompt) {
        String effectiveApiKey = AiModelResolver.resolveApiKey(systemSettingsService, defaultApiKey);

        if (effectiveApiKey.isBlank() || "dummy".equals(effectiveApiKey) || "default_key_placeholder".equals(effectiveApiKey)) {
            throw new ServiceUnavailableException("Chưa cấu hình Gemini API key");
        }

        String effectiveModel = AiModelResolver.resolveModel(systemSettingsService, defaultModel);
        double effectiveTemp = AiModelResolver.resolveTemperature(systemSettingsService, 0.3);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", effectiveApiKey);
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", effectiveTemp,
                        "maxOutputTokens", 8192,
                        "responseMimeType", "application/json"));
        try {
            log.info("Generating questions using Gemini model: {}, temperature: {}", effectiveModel, effectiveTemp);
            ResponseEntity<String> response = restTemplate.exchange(
                    ENDPOINT.formatted(effectiveModel),
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class);
            return extractText(response.getBody());
        } catch (ServiceUnavailableException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            log.warn("Gemini question generation failed: {}", ex.getClass().getSimpleName());
            throw new ServiceUnavailableException("AI chưa soạn đủ câu hỏi hợp lệ. Hãy thử lại.", ex);
        }
    }

    private String extractText(String body) {
        try {
            JsonNode root = objectMapper.readTree(body == null ? "" : body);
            JsonNode text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (!text.isTextual() || text.asText().isBlank()) {
                throw new ServiceUnavailableException("AI chưa soạn đủ câu hỏi hợp lệ. Hãy thử lại.");
            }
            return text.asText();
        } catch (ServiceUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ServiceUnavailableException("AI chưa soạn đủ câu hỏi hợp lệ. Hãy thử lại.", ex);
        }
    }
}
