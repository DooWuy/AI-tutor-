package com.vn.aitutor.analytics;

import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.pdmodel.common.PDRectangle;

public final class PdfLayout {

    public static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    public static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    public static final float MARGIN = 48f;

    private PdfLayout() {}

    public static float contentWidth() {
        return PAGE_WIDTH - (2 * MARGIN);
    }

    public static float contentRight() {
        return PAGE_WIDTH - MARGIN;
    }

    public static Box chartBox(float topY, float height) {
        return new Box(MARGIN, topY - height, contentWidth(), height);
    }

    public static boolean contains(Box box) {
        return box.x() >= MARGIN - 0.01f
                && box.y() >= MARGIN - 0.01f
                && box.x() + box.width() <= contentRight() + 0.01f
                && box.y() + box.height() <= PAGE_HEIGHT - MARGIN + 0.01f;
    }

    public static List<String> wrap(String text, float maxWidth, TextWidth width) {
        if (text == null || text.isBlank() || maxWidth <= 0) {
            return List.of();
        }
        List<String> lines = new ArrayList<>();
        for (String paragraph : text.replace('\t', ' ').split("\\R")) {
            if (paragraph.isBlank()) {
                continue;
            }
            StringBuilder current = new StringBuilder();
            for (String word : paragraph.trim().split("\\s+")) {
                for (String piece : breakWord(word, maxWidth, width)) {
                    if (current.isEmpty()) {
                        current.append(piece);
                        continue;
                    }
                    String candidate = current + " " + piece;
                    if (width.of(candidate) <= maxWidth) {
                        current.append(' ').append(piece);
                    } else {
                        lines.add(current.toString());
                        current.setLength(0);
                        current.append(piece);
                    }
                }
            }
            if (!current.isEmpty()) {
                lines.add(current.toString());
            }
        }
        return lines;
    }

    private static List<String> breakWord(String word, float maxWidth, TextWidth width) {
        if (width.of(word) <= maxWidth) {
            return List.of(word);
        }
        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (int i = 0; i < word.length(); ) {
            int codePoint = word.codePointAt(i);
            String character = new String(Character.toChars(codePoint));
            String candidate = current + character;
            if (current.isEmpty() || width.of(candidate) <= maxWidth) {
                current.append(character);
            } else {
                parts.add(current.toString());
                current.setLength(0);
                current.append(character);
            }
            i += Character.charCount(codePoint);
        }
        if (!current.isEmpty()) {
            parts.add(current.toString());
        }
        return parts;
    }

    @FunctionalInterface
    public interface TextWidth {
        float of(String text);
    }

    public record Box(float x, float y, float width, float height) {}
}
