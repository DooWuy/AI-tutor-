package com.vn.aitutor.curriculum;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class SampleTextbookSplitTest {

    @Test
    void splitsTheFirstLessonAtPdfPagesSevenThroughNine() throws Exception {
        byte[] bytes = Files.readAllBytes(textbook());

        assertEquals(142, PdfSplitterUtil.pageCount(bytes));
        assertFalse(PrintedPageOffsetDetector.detect(bytes).isPresent());

        byte[] lesson = PdfSplitterUtil.split(bytes, 7, 9);
        assertEquals(3, PdfSplitterUtil.pageCount(lesson));
        assertEquals('%', (char) lesson[0]);
        assertEquals('P', (char) lesson[1]);
    }

    private static Path textbook() {
        Path[] candidates = new Path[] {
                Path.of("..", "docs", "SGK - Toán 5 - Tập 1 - Chương trình mới.pdf"),
                Path.of("docs", "SGK - Toán 5 - Tập 1 - Chương trình mới.pdf"),
                Path.of("D:\\AI-tutor-\\docs\\SGK - Toán 5 - Tập 1 - Chương trình mới.pdf")
        };
        for (Path candidate : candidates) {
            if (Files.exists(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Không thấy file sách mẫu trong docs");
    }
}
