package com.vn.aitutor.service.ai;

import com.vn.aitutor.agent.QuestionGeneratorAgent;
import com.vn.aitutor.dto.request.QuestionBankCreateRequest;
import com.vn.aitutor.dto.response.QuestionBankListResponse;
import com.vn.aitutor.entity.enums.QuestionType;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
public class GeminiQuestionGeneratorAgent implements QuestionGeneratorAgent {

    private final String geminiApiKey;
    private final String geminiApiUrl;
    private final RestTemplate restTemplate;
    private final JsonMapper objectMapper;

    public GeminiQuestionGeneratorAgent(String geminiApiKey, String geminiApiUrl) {
        this.geminiApiKey = geminiApiKey;
        this.geminiApiUrl = geminiApiUrl;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(120000);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = JsonMapper.builder().build();
    }

    @Override
    public QuestionBankListResponse generateQuestions(
            String subject, String gradeLevel, String skill, int difficulty, int count) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured");
        }
        try {
            String raw = callGemini(prompt(subject, gradeLevel, skill, difficulty, count));
            return parseQuestions(raw);
        } catch (RestClientException ex) {
            throw new IllegalStateException("Gemini question generation failed: " + ex.getMessage(), ex);
        }
    }

    private String callGemini(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "responseMimeType", "application/json"));
        String url = geminiApiUrl + "?key=" + java.net.URLEncoder.encode(geminiApiKey, StandardCharsets.UTF_8);
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body, headers), new ParameterizedTypeReference<>() {});
        return extractText(response.getBody());
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> responseBody) {
        if (responseBody == null) {
            throw new IllegalStateException("empty Gemini response");
        }
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini response missing candidates");
        }
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = content == null ? null : (List<Map<String, Object>>) content.get("parts");
        Object text = parts == null || parts.isEmpty() ? null : parts.get(0).get("text");
        if (text == null) {
            throw new IllegalStateException("Gemini response missing text");
        }
        return text.toString();
    }

    private QuestionBankListResponse parseQuestions(String raw) {
        String cleaned = raw == null ? "" : raw.replaceAll("(?is)^```json\\s*|\\s*```$", "").trim();
        JsonNode root = objectMapper.readTree(cleaned);
        JsonNode questionsNode = root.get("questions");
        if (questionsNode == null || !questionsNode.isArray()) {
            throw new IllegalStateException("Gemini response missing questions array");
        }
        List<QuestionBankCreateRequest> questions = new ArrayList<>();
        for (JsonNode node : questionsNode) {
            QuestionBankCreateRequest question = new QuestionBankCreateRequest();
            question.setStem(text(node, "stem"));
            question.setType(type(node.get("type")));
            question.setDifficulty(integer(node, "difficulty"));
            question.setChoices(strings(node.get("choices")));
            question.setCorrectAnswer(text(node, "correctAnswer"));
            question.setExplanation(text(node, "explanation"));
            question.setTags(strings(node.get("tags")));
            questions.add(question);
        }
        QuestionBankListResponse response = new QuestionBankListResponse();
        response.setQuestions(questions);
        return response;
    }

    private String prompt(String subject, String gradeLevel, String skill, int difficulty, int count) {
        return """
                Bạn là giáo viên chuyên môn môn %s cấp %s.
                Tạo chính xác %d câu hỏi cho kỹ năng: %s, mức độ khó: %d.
                Chỉ trả JSON hợp lệ theo dạng {"questions":[...]}.
                Mỗi item bắt buộc có:
                - type: một trong MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER
                - stem: nội dung câu hỏi rõ ràng
                - choices: MULTIPLE_CHOICE có 4 lựa chọn; TRUE_FALSE có ["Đúng","Sai"]; dạng điền/tự luận dùng []
                - correctAnswer: nếu có choices thì phải trùng đúng một phần tử trong choices; nếu không thì là đáp án ngắn
                - explanation: lời giải thích rõ ràng
                - difficulty: số từ 1 đến 5
                - tags: mảng chuỗi ngắn
                """.formatted(subject, gradeLevel, count, skill, difficulty);
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? null : value.asString();
    }

    private Integer integer(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? null : value.asInt();
    }

    private QuestionType type(JsonNode value) {
        if (value == null || value.isNull()) {
            return QuestionType.MULTIPLE_CHOICE;
        }
        try {
            return QuestionType.valueOf(value.asString());
        } catch (IllegalArgumentException ex) {
            log.warn("Unknown question type from Gemini: {}", value.asString());
            return QuestionType.MULTIPLE_CHOICE;
        }
    }

    private List<String> strings(JsonNode value) {
        if (value == null || value.isNull() || !value.isArray()) {
            return List.of();
        }
        List<String> result = new ArrayList<>();
        for (JsonNode item : value) {
            if (item != null && !item.isNull()) {
                result.add(item.asString());
            }
        }
        return result;
    }
}
