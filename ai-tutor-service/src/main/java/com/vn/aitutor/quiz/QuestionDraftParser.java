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
            boolean correct = bool(choice, "correct") || bool(choice, "isCorrect");
            choices.add(new ChoiceInput(text(choice, "key"), text(choice, "text"), correct));
        }
        markAnswerKey(choices, text(item, "correctText"));
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
        String json = trimmed.substring(start, end + 1);
        JsonNode parsed = readTree(json);
        if (parsed == null) {
            parsed = readTree(repairEscapes(json));
        }
        return parsed;
    }

    private static JsonNode readTree(String json) {
        try {
            return MAPPER.readTree(json);
        } catch (Exception ex) {
            return null;
        }
    }

    private static String repairEscapes(String json) {
        StringBuilder repaired = new StringBuilder(json.length() + 32);
        for (int i = 0; i < json.length(); i++) {
            char current = json.charAt(i);
            if (current != '\\' || i + 1 >= json.length()) {
                repaired.append(current);
                continue;
            }
            char next = json.charAt(i + 1);
            if (isLikelyLatexCommand(json, i + 1)) {
                repaired.append("\\\\");
            } else if ("\"\\/bfnrtu".indexOf(next) >= 0) {
                repaired.append(current);
            } else {
                repaired.append("\\\\");
            }
        }
        return repaired.toString();
    }

    private static boolean isLikelyLatexCommand(String text, int start) {
        return text.startsWith("frac", start)
                || text.startsWith("neq", start)
                || text.startsWith("times", start)
                || text.startsWith("text", start)
                || text.startsWith("begin", start)
                || text.startsWith("right", start)
                || text.startsWith("to", start)
                || text.startsWith("tan", start);
    }

    private static void markAnswerKey(List<ChoiceInput> choices, String correctText) {
        if (correctText == null || correctText.isBlank()) {
            return;
        }
        if (choices.stream().filter(ChoiceInput::correct).count() == 1) {
            return;
        }
        String key = correctText.trim();
        for (int i = 0; i < choices.size(); i++) {
            ChoiceInput choice = choices.get(i);
            boolean selected = key.equalsIgnoreCase(choice.key()) || key.equalsIgnoreCase(choice.text());
            choices.set(i, new ChoiceInput(choice.key(), choice.text(), selected));
        }
    }

    private static boolean bool(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return false;
        }
        if (value.isBoolean()) {
            return value.asBoolean();
        }
        return "true".equalsIgnoreCase(value.asText(""));
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return "";
        }
        String s = value.asText("");
        s = s.replace("\u000crac", "\\frac").replace("⬆rac", "\\frac");
        s = s.replaceAll("(?<=\\s|^)x\\s*\\n\\s*eq\\b", "x \\\\neq");
        s = s.replaceAll("(?<=\\s|^)xeq\\s*(?=[-0-9])", "x \\\\neq ");
        return s;
    }
}
