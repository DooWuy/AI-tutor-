package com.vn.aitutor.curriculum;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.junit.jupiter.api.Test;

class PrintedPageOffsetDetectorTest {

    @Test
    void detectsTheGapBetweenPdfIndexAndPrintedPageNumber() throws IOException {
        byte[] pdf = book("Cover", "Lesson\n1", "Next\n2", "More\n3");

        assertEquals(1, PrintedPageOffsetDetector.detect(pdf).orElseThrow());
    }

    @Test
    void leavesOffsetEmptyWhenPrintedNumbersMatchThePdfIndex() throws IOException {
        byte[] pdf = book("Opening\n1", "Lesson\n2");

        assertFalse(PrintedPageOffsetDetector.detect(pdf).isPresent());
    }

    private static byte[] book(String... pages) throws IOException {
        try (PDDocument document = new PDDocument()) {
            for (String pageText : pages) {
                PDPage page = new PDPage();
                document.addPage(page);
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    stream.beginText();
                    stream.setFont(PDType1Font.HELVETICA, 12);
                    stream.newLineAtOffset(72, 720);
                    for (String line : pageText.split("\n")) {
                        stream.showText(line);
                        stream.newLineAtOffset(0, -18);
                    }
                    stream.endText();
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }
}
