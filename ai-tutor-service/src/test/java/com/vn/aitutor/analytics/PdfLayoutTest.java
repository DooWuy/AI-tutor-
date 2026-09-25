package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class PdfLayoutTest {

    @Test
    void chartBoxStaysInsideA4Margins() {
        PdfLayout.Box box = PdfLayout.chartBox(PdfLayout.PAGE_HEIGHT - PdfLayout.MARGIN, 140f);
        assertTrue(PdfLayout.contains(box));

        PdfLayout.Box tooTall = PdfLayout.chartBox(PdfLayout.MARGIN + 10, 140f);
        assertFalse(PdfLayout.contains(tooTall));
    }

    @Test
    void wrappedLinesStayWithinContentWidth() {
        String text = "Nên chữa một bài mẫu trên lớp về thể tích hình nón rồi cho thêm bài tập tương tự. ".repeat(8);
        float maxWidth = PdfLayout.contentWidth();
        List<String> lines = PdfLayout.wrap(text, maxWidth, line -> line.length() * 6f);
        assertFalse(lines.isEmpty());
        for (String line : lines) {
            assertTrue(line.length() * 6f <= maxWidth + 0.01f);
        }

        List<String> broken = PdfLayout.wrap("A".repeat(500), 48f, line -> line.length() * 6f);
        assertTrue(broken.size() > 1);
        for (String line : broken) {
            assertTrue(line.length() * 6f <= 48f + 0.01f);
        }
    }
}
