package com.vn.aitutor.service;

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

@Slf4j
@Component
public class GeminiQuestionClient {

    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final RestTemplate restTemplate;
    private final JsonMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GeminiQuestionClient(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.question.model:gemini-3.5-flash-lite}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.objectMapper = JsonMapper.builder().build();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(120_000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String complete(String prompt) {
        if (apiKey.isBlank() || "dummy".equals(apiKey) || "default_key_placeholder".equals(apiKey)) {
            throw new ServiceUnavailableException("Chưa cấu hình Gemini API key");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 8192,
                        "responseMimeType", "application/json"));
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    ENDPOINT.formatted(model),
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
