package com.vn.aitutor.service.ai;

import com.vn.aitutor.exception.IngestionException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Component
public class GeminiEmbeddingClient {

    public static final String DEFAULT_MODEL = "models/gemini-embedding-001";
    public static final int DIMENSIONS = 768;

    private final RestTemplate restTemplate;
    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private final String apiKey;
    private final String model;
    private final String url;

    public GeminiEmbeddingClient(
            @Value("${gemini.api.key:${GEMINI_API_KEY:}}") String apiKey,
            @Value("${gemini.api.embedding-model:models/gemini-embedding-001}") String model,
            @Value("${gemini.api.embedding-url:https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents}") String url) {
        this.apiKey = apiKey;
        this.model = model;
        this.url = url;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(60000);
        this.restTemplate = new RestTemplate(factory);
    }

    public float[][] embed(List<String> inputs) {
        if (inputs == null || inputs.isEmpty()) {
            return new float[0][];
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IngestionException("Thiếu GEMINI_API_KEY");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            String requestUrl = url + "?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.exchange(
                    requestUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody(model, inputs), headers),
                    new ParameterizedTypeReference<>() {});
            return parseEmbeddings(response.getBody(), inputs.size());
        } catch (IngestionException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new IngestionException("Không sinh được vector (Gemini): " + ex.getMessage(), ex);
        }
    }

    public static Map<String, Object> requestBody(String model, List<String> inputs) {
        List<Map<String, Object>> requests = new ArrayList<>();
        for (String input : inputs) {
            Map<String, Object> req = new LinkedHashMap<>();
            req.put("model", model);
            req.put("outputDimensionality", DIMENSIONS);
            
            Map<String, Object> content = new LinkedHashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new LinkedHashMap<>();
            part.put("text", input);
            parts.add(part);
            
            content.put("parts", parts);
            req.put("content", content);
            
            requests.add(req);
        }
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("requests", requests);
        return body;
    }

    private float[][] parseEmbeddings(String body, int expected) {
        if (body == null || body.isBlank()) {
            throw new IngestionException("Gemini không trả vector");
        }
        try {
            JsonNode root = jsonMapper.readTree(body);
            JsonNode embeddings = root.get("embeddings");
            if (embeddings == null || !embeddings.isArray() || embeddings.size() != expected) {
                throw new IngestionException("Gemini trả số vector không khớp");
            }
            float[][] vectors = new float[expected][];
            for (int i = 0; i < embeddings.size(); i++) {
                JsonNode item = embeddings.get(i);
                JsonNode values = item.get("values");
                if (values == null || !values.isArray() || values.size() != DIMENSIONS) {
                    throw new IngestionException("Vector không đúng 768 chiều");
                }
                float[] vector = new float[DIMENSIONS];
                for (int j = 0; j < DIMENSIONS; j++) {
                    vector[j] = (float) values.get(j).asDouble();
                }
                vectors[i] = vector;
            }
            return vectors;
        } catch (Exception e) {
            throw new IngestionException("Lỗi khi parse vector từ Gemini", e);
        }
    }

    public String getModel() {
        return model;
    }
}
