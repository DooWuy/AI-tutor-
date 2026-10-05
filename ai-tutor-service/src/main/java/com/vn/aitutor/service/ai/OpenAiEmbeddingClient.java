package com.vn.aitutor.service.ai;

import com.vn.aitutor.exception.IngestionException;
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
public class OpenAiEmbeddingClient {

    public static final String DEFAULT_MODEL = "text-embedding-3-small";
    public static final int DIMENSIONS = 1536;

    private final RestTemplate restTemplate;
    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private final String apiKey;
    private final String model;
    private final String url;

    public OpenAiEmbeddingClient(
            @Value("${openai.api.key:}") String apiKey,
            @Value("${openai.api.embedding-model:text-embedding-3-small}") String model,
            @Value("${openai.api.url:https://api.openai.com/v1/embeddings}") String url) {
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
            throw new IngestionException("Thiếu OPENAI_API_KEY");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody(model, inputs), headers),
                    new ParameterizedTypeReference<>() {});
            return parseEmbeddings(response.getBody(), inputs.size());
        } catch (IngestionException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new IngestionException("Không sinh được vector: " + ex.getMessage(), ex);
        }
    }

    public static Map<String, Object> requestBody(String model, List<String> inputs) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("input", inputs);
        return body;
    }

    private float[][] parseEmbeddings(String body, int expected) {
        if (body == null || body.isBlank()) {
            throw new IngestionException("OpenAI không trả vector");
        }
        JsonNode data = jsonMapper.readTree(body).get("data");
        if (data == null || !data.isArray() || data.size() != expected) {
            throw new IngestionException("OpenAI trả số vector không khớp");
        }
        float[][] vectors = new float[expected][];
        for (JsonNode item : data) {
            int index = item.path("index").asInt();
            JsonNode embedding = item.get("embedding");
            if (embedding == null || !embedding.isArray() || embedding.size() != DIMENSIONS) {
                throw new IngestionException("Vector không đúng 1536 chiều");
            }
            float[] vector = new float[DIMENSIONS];
            for (int i = 0; i < DIMENSIONS; i++) {
                vector[i] = (float) embedding.get(i).asDouble();
            }
            if (index < 0 || index >= expected) {
                throw new IngestionException("OpenAI trả chỉ số vector không hợp lệ");
            }
            vectors[index] = vector;
        }
        return vectors;
    }

    public String getModel() {
        return model;
    }
}
