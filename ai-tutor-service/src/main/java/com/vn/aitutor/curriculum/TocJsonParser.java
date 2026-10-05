package com.vn.aitutor.curriculum;

import com.vn.aitutor.curriculum.TocDrafts.TocChapterDraft;
import com.vn.aitutor.curriculum.TocDrafts.TocLessonDraft;
import com.vn.aitutor.exception.ServiceUnavailableException;
import java.util.ArrayList;
import java.util.List;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

public final class TocJsonParser {

    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private TocJsonParser() {
    }

    public static List<TocChapterDraft> parseAll(List<String> raws) {
        List<TocChapterDraft> merged = new ArrayList<>();
        for (String raw : raws) {
            merged.addAll(parse(raw));
        }
        return merged;
    }

    public static List<TocChapterDraft> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ServiceUnavailableException("Không phân tích được mục lục");
        }
        String cleaned = raw.replaceAll("(?is)```json", "").replace("```", "").trim();
        int array = cleaned.indexOf('[');
        int object = cleaned.indexOf('{');
        int start = array < 0 ? object : object < 0 ? array : Math.min(array, object);
        if (start > 0) {
            cleaned = cleaned.substring(start);
        }
        try {
            JsonNode root = MAPPER.readTree(cleaned);
            JsonNode chapters = root.isArray() ? root : firstArray(root, "chapters", "items");
            if (chapters == null || !chapters.isArray()) {
                throw new ServiceUnavailableException("Không phân tích được mục lục");
            }
            List<TocChapterDraft> parsed = new ArrayList<>();
            for (JsonNode chapter : chapters) {
                String name = text(chapter, "chapterName", "chapter", "name");
                JsonNode lessons = firstArray(chapter, "lessons", "items");
                List<TocLessonDraft> lessonDrafts = new ArrayList<>();
                if (lessons != null) {
                    for (JsonNode lesson : lessons) {
                        lessonDrafts.add(new TocLessonDraft(
                                text(lesson, "lessonName", "lesson", "name"),
                                integer(lesson, "startPage", "page"),
                                integer(lesson, "endPage"),
                                false,
                                null));
                    }
                }
                if (name != null || !lessonDrafts.isEmpty()) {
                    parsed.add(new TocChapterDraft(name, lessonDrafts, false));
                }
            }
            return parsed;
        } catch (ServiceUnavailableException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new ServiceUnavailableException("Không phân tích được mục lục", ex);
        }
    }

    private static JsonNode firstArray(JsonNode node, String... names) {
        if (node == null) {
            return null;
        }
        for (String name : names) {
            JsonNode child = node.get(name);
            if (child != null && child.isArray()) {
                return child;
            }
        }
        return null;
    }

    private static String text(JsonNode node, String... names) {
        for (String name : names) {
            JsonNode child = node.get(name);
            if (child != null && !child.isNull() && !child.asString().isBlank()) {
                return child.asString().trim();
            }
        }
        return null;
    }

    private static Integer integer(JsonNode node, String... names) {
        for (String name : names) {
            JsonNode child = node.get(name);
            if (child == null || child.isNull()) {
                continue;
            }
            if (child.isNumber()) {
                return child.asInt();
            }
            String raw = child.asString().replaceAll("[^0-9]", "");
            if (!raw.isBlank()) {
                return Integer.parseInt(raw);
            }
        }
        return null;
    }
}
