package com.vn.aitutor.curriculum;

import java.io.IOException;
import java.util.OptionalInt;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

public final class PrintedPageOffsetDetector {

    private static final Pattern TRAILING_NUMBER = Pattern.compile("(\\d{1,4})\\s*$");

    private PrintedPageOffsetDetector() {
    }

    public static OptionalInt detect(byte[] pdf) {
        try (PDDocument document = PDDocument.load(pdf)) {
            PDFTextStripper stripper = new PDFTextStripper();
            int limit = Math.min(document.getNumberOfPages(), 12);
            for (int page = 1; page <= limit; page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                String text = stripper.getText(document);
                if (text == null || text.isBlank()) {
                    continue;
                }
                Matcher matcher = TRAILING_NUMBER.matcher(text.trim());
                if (!matcher.find()) {
                    continue;
                }
                int printed = Integer.parseInt(matcher.group(1));
                if (printed > 0 && printed < page) {
                    return OptionalInt.of(page - printed);
                }
            }
        } catch (IOException ex) {
            return OptionalInt.empty();
        }
        return OptionalInt.empty();
    }
}
