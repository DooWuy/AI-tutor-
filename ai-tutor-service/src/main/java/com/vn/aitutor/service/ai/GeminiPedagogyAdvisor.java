package com.vn.aitutor.service.ai;

import com.vn.aitutor.analytics.KnowledgeGapCalculator;
import com.vn.aitutor.analytics.TopicText;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
public class GeminiPedagogyAdvisor implements PedagogyAdvisor {

    private static final int MAX_ADVICE_CHARS = 1000;

    private final TemplatePedagogyAdvisor template;
    private final RestTemplate restTemplate;
    private final JsonMapper objectMapper;
    private final String geminiApiKey;
    private final String geminiApiUrl;

    public GeminiPedagogyAdvisor(
            TemplatePedagogyAdvisor template,
            @Value("${gemini.api.key:}") String geminiApiKey,
            @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent}")
                    String geminiApiUrl) {
        this.template = template;
        this.geminiApiKey = geminiApiKey;
        this.geminiApiUrl = geminiApiUrl;
        this.objectMapper = JsonMapper.builder()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .build();
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(8000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public Map<String, String> advise(List<GapAdviceRequest> gaps) {
        return adviseWithSource(gaps).advice();
    }

    public AdviceResult adviseWithSource(List<GapAdviceRequest> gaps) {
        Map<String, String> fallback = template.advise(gaps);
        if (gaps == null || gaps.isEmpty() || !canCall()) {
            return new AdviceResult(fallback, false);
        }
        try {
            Map<String, String> fromModel = call(gaps);
            Map<String, String> merged = new LinkedHashMap<>(fallback);
            boolean usedModel = false;
            for (GapAdviceRequest gap : gaps) {
                String advice = lookup(fromModel, gap.topic());
                if (advice != null && !advice.isBlank()) {
                    merged.put(gap.topic(), limit(advice));
                    usedModel = true;
                }
            }
            return new AdviceResult(merged, usedModel);
        } catch (RuntimeException ex) {
            log.warn("Gemini pedagogy advice failed, using template: {}", ex.getMessage());
            return new AdviceResult(fallback, false);
        }
    }

    private boolean canCall() {
        return geminiApiKey != null
                && !geminiApiKey.isBlank()
                && !"default_key_placeholder".equals(geminiApiKey);
    }

    private Map<String, String> call(List<GapAdviceRequest> gaps) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = Map.of(
                "contents",
                List.of(Map.of("parts", List.of(Map.of("text", prompt(gaps))))),
                "generationConfig",
                Map.of("temperature", 0.2));
        String url = geminiApiUrl + "?key=" + java.net.URLEncoder.encode(geminiApiKey, StandardCharsets.UTF_8);
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    new ParameterizedTypeReference<>() {});
            String text = extractText(response.getBody());
            return parseAdvice(text);
        } catch (RestClientException ex) {
            throw new IllegalStateException(ex.getMessage(), ex);
        }
    }

    private String prompt(List<GapAdviceRequest> gaps) {
        StringBuilder builder = new StringBuilder();
        builder.append("Bạn là chuyên gia sư phạm. Viết một lời khuyên ngắn, tiếng Việt, cho giáo viên về từng chủ đề. ");
        builder.append("Giữ nguyên đúng chuỗi chủ đề. Không thêm chủ đề. Không đổi các con số. ");
        builder.append("Chỉ trả JSON {\"items\":[{\"topic\":\"...\",\"advice\":\"...\"}]} không bọc markdown.\n");
        for (GapAdviceRequest gap : gaps) {
            builder.append("- Chủ đề: ")
                    .append(gap.topic())
                    .append("; môn: ")
                    .append(gap.subject())
                    .append("; tỷ lệ học sinh bị hổng: ")
                    .append(KnowledgeGapCalculator.formatPercent(gap.affectedPercent()))
                    .append("% (")
                    .append(gap.affectedStudentCount())
                    .append('/')
                    .append(gap.classSize())
                    .append("); số câu sai: ")
                    .append(gap.wrongAnswerCount())
                    .append("; số học sinh đã hỏi về chủ đề: ")
                    .append(gap.askingStudentCount())
                    .append('\n');
            for (String excerpt : gap.excerpts()) {
                builder.append("  Trích hỏi đáp: ").append(excerpt).append('\n');
            }
        }
        return builder.toString();
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> responseBody) {
        if (responseBody == null) {
            throw new IllegalStateException("empty gemini body");
        }
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        Object text = parts.get(0).get("text");
        if (text == null) {
            throw new IllegalStateException("gemini text missing");
        }
        return text.toString();
    }

    private Map<String, String> parseAdvice(String raw) {
        String cleaned = raw == null ? "" : raw.replaceAll("(?is)^```json\\s*|\\s*```$", "").trim();
        JsonNode root = objectMapper.readTree(cleaned);
        JsonNode items = root.isArray() ? root : root.get("items");
        Map<String, String> advice = new LinkedHashMap<>();
        if (items == null || !items.isArray()) {
            throw new IllegalStateException("gemini advice json missing items");
        }
        for (JsonNode item : items) {
            JsonNode topic = item.get("topic");
            JsonNode text = item.get("advice");
            if (topic == null || text == null || topic.asString().isBlank()) {
                continue;
            }
            advice.put(topic.asString().trim(), text.asString());
        }
        return advice;
    }

    private String lookup(Map<String, String> fromModel, String topic) {
        if (fromModel.containsKey(topic)) {
            return fromModel.get(topic);
        }
        String folded = TopicText.fold(topic);
        for (Map.Entry<String, String> entry : fromModel.entrySet()) {
            if (TopicText.fold(entry.getKey()).equals(folded)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String limit(String advice) {
        String trimmed = advice.trim();
        if (trimmed.length() <= MAX_ADVICE_CHARS) {
            return trimmed;
        }
        return trimmed.substring(0, MAX_ADVICE_CHARS);
    }
}
