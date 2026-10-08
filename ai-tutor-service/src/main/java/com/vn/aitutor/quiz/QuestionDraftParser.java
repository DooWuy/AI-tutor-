package com.vn.aitutor.quiz;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn.aitutor.entity.enums.QuestionType;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public final class QuestionDraftParser {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private QuestionDraftParser() {
    }

    public static List<NormalizedQuestion> parse(
            String raw, QuestionType type, int difficulty, int exactChoiceCount, List<String> existingStems) {
        List<NormalizedQuestion> accepted = new ArrayList<>();
        JsonNode root = readRoot(raw);
        if (root == null) {
            return accepted;
        }
        JsonNode items = root.isArray() ? root : root.path("questions");
        if (!items.isArray()) {
            return accepted;
        }
        for (JsonNode item : items) {
            Optional<NormalizedQuestion> question = acceptItem(item, type, difficulty, exactChoiceCount);
            if (question.isEmpty()) {
                continue;
            }
            String stemKey = question.get().stem().toLowerCase(Locale.ROOT);
            boolean duplicate = existingStems.stream().anyMatch(stem -> stem.equalsIgnoreCase(stemKey))
                    || accepted.stream().anyMatch(saved -> saved.stem().equalsIgnoreCase(question.get().stem()));
            if (duplicate) {
                continue;
            }
            accepted.add(question.get());
        }
        return accepted;
    }

    private static Optional<NormalizedQuestion> acceptItem(
            JsonNode item, QuestionType type, int difficulty, int exactChoiceCount) {
        List<ChoiceInput> choices = new ArrayList<>();
        for (JsonNode choice : item.path("choices")) {
            boolean correct = choice.path("correct").asBoolean(false) || choice.path("isCorrect").asBoolean(false);
            choices.add(new ChoiceInput(text(choice, "key"), text(choice, "text"), correct));
        }
        List<String> tags = new ArrayList<>();
        for (JsonNode tag : item.path("tags")) {
            if (tag.isTextual()) {
                tags.add(tag.asText());
            }
        }
        return QuestionContentRules.tryAccept(
                text(item, "stem"),
                text(item, "explanation"),
                type,
                choices,
                tags,
                difficulty,
                text(item, "correctText"),
                exactChoiceCount);
    }

    private static JsonNode readRoot(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int firstBreak = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstBreak > 0 && lastFence > firstBreak) {
                trimmed = trimmed.substring(firstBreak + 1, lastFence).trim();
            }
        }
        int startObject = trimmed.indexOf('{');
        int startArray = trimmed.indexOf('[');
        int start;
        int end;
        if (startArray >= 0 && (startObject < 0 || startArray < startObject)) {
            start = startArray;
            end = trimmed.lastIndexOf(']');
        } else {
            start = startObject;
            end = trimmed.lastIndexOf('}');
        }
        if (start < 0 || end <= start) {
            return null;
        }
        try {
            return MAPPER.readTree(trimmed.substring(start, end + 1));
        } catch (Exception ex) {
            return null;
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? "" : value.asText("");
    }
}
