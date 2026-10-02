package com.vn.aitutor.curriculum;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class LatexAwareSplitter {

    public static final int MAX_CHARS = 1000;
    public static final int OVERLAP = 150;

    private static final Pattern BLOCK_MATH = Pattern.compile("\\$\\$[\\s\\S]*?\\$\\$");
    private static final Pattern INLINE_MATH = Pattern.compile("(?<!\\$)\\$(?!\\$)[^$\\n]{1,400}(?<!\\$)\\$(?!\\$)");

    private LatexAwareSplitter() {
    }

    public static List<String> split(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        List<String> formulas = new ArrayList<>();
        String masked = mask(text.replace("\r\n", "\n").trim(), BLOCK_MATH, formulas);
        masked = mask(masked, INLINE_MATH, formulas);
        List<String> chunks = new ArrayList<>();
        for (String piece : slide(masked)) {
            String restored = restore(piece, formulas).trim();
            if (!restored.isBlank()) {
                chunks.add(restored);
            }
        }
        return chunks;
    }

    private static String mask(String text, Pattern pattern, List<String> formulas) {
        Matcher matcher = pattern.matcher(text);
        StringBuilder out = new StringBuilder();
        int last = 0;
        while (matcher.find()) {
            String formula = matcher.group();
            out.append(text, last, matcher.start());
            if (formula.length() <= MAX_CHARS) {
                out.append('\u0000').append('M').append(formulas.size()).append('\u0000');
                formulas.add(formula);
            } else {
                out.append(formula);
            }
            last = matcher.end();
        }
        out.append(text.substring(last));
        return out.toString();
    }

    private static List<String> slide(String text) {
        if (text.length() <= MAX_CHARS) {
            return List.of(text);
        }
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(text.length(), start + MAX_CHARS);
            end = avoidPlaceholder(text, start, end);
            if (end < text.length()) {
                int breakAt = text.lastIndexOf('\n', end);
                if (breakAt > start + MAX_CHARS / 2) {
                    end = breakAt;
                }
            }
            String piece = text.substring(start, end).trim();
            if (!piece.isBlank()) {
                chunks.add(piece);
            }
            if (end >= text.length()) {
                break;
            }
            int next = end - OVERLAP;
            start = next <= start ? end : next;
        }
        return chunks;
    }

    private static int avoidPlaceholder(String text, int start, int end) {
        int open = text.lastIndexOf('\u0000', end - 1);
        if (open < start) {
            return end;
        }
        int close = text.indexOf('\u0000', open + 1);
        if (close >= end) {
            return Math.min(text.length(), close + 1);
        }
        return end;
    }

    private static String restore(String text, List<String> formulas) {
        Matcher matcher = Pattern.compile("\u0000M(\\d+)\u0000").matcher(text);
        StringBuilder out = new StringBuilder();
        int last = 0;
        while (matcher.find()) {
            out.append(text, last, matcher.start());
            int index = Integer.parseInt(matcher.group(1));
            out.append(index >= 0 && index < formulas.size() ? formulas.get(index) : matcher.group());
            last = matcher.end();
        }
        out.append(text.substring(last));
        return out.toString();
    }
}
