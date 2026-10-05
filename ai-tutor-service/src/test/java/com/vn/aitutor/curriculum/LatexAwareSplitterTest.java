package com.vn.aitutor.curriculum;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class LatexAwareSplitterTest {

    @Test
    void keepsADisplayFormulaInsideASingleChunk() {
        String formula = "$$\\int_{a}^{b} f(x) dx$$";
        String text = "A".repeat(900) + "\n" + formula + "\n" + "B".repeat(900);

        List<String> chunks = LatexAwareSplitter.split(text);

        assertTrue(chunks.stream().anyMatch(chunk -> chunk.contains(formula)));
        for (String chunk : chunks) {
            assertFalse(chunk.contains("$$\\int") && !chunk.contains(formula));
            assertTrue(count(chunk, "$$") % 2 == 0);
        }
    }

    @Test
    void overlapsAdjacentChunksByAboutOneHundredFiftyCharacters() {
        String text = ("doan van ban ".repeat(12) + "\n").repeat(40);

        List<String> chunks = LatexAwareSplitter.split(text);

        assertTrue(chunks.size() > 1);
        for (String chunk : chunks) {
            assertTrue(chunk.length() <= LatexAwareSplitter.MAX_CHARS);
        }
        String tail = chunks.get(0).substring(Math.max(0, chunks.get(0).length() - 80));
        assertTrue(chunks.get(1).contains(tail));
    }

    private static int count(String text, String token) {
        int found = 0;
        int from = 0;
        while (true) {
            int index = text.indexOf(token, from);
            if (index < 0) {
                return found;
            }
            found++;
            from = index + token.length();
        }
    }
}
