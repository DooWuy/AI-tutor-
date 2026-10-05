package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.exception.ResourceBadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class LearningMaterialValidatorTest {

    private final LearningMaterialValidator validator = new LearningMaterialValidator();

    @Test
    void acceptsPdfDocxMarkdownAndTextWithinFiftyMegabytes() {
        assertDoesNotThrow(() -> validator.validateSupplement(pdf("notes.pdf", "application/pdf")));
        assertDoesNotThrow(() -> validator.validateSupplement(file(
                "notes.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new byte[] {'P', 'K', 3, 4},
                120)));
        assertDoesNotThrow(() -> validator.validateSupplement(file("notes.md", "text/markdown", "a".getBytes(), 1)));
        assertDoesNotThrow(() -> validator.validateSupplement(file("notes.txt", "text/plain", "a".getBytes(), 1)));
    }

    @Test
    void rejectsZipAndFilesOverFiftyMegabytes() {
        ResourceBadRequestException zip = assertThrows(ResourceBadRequestException.class,
                () -> validator.validateSupplement(file("bundle.zip", "application/zip", new byte[] {'P', 'K'}, 20)));
        assertTrue(zip.getMessage().contains(".pdf"));

        ResourceBadRequestException huge = assertThrows(ResourceBadRequestException.class,
                () -> validator.validateSupplement(pdfSized("book.pdf", LearningMaterialValidator.SUPPLEMENT_MAX_BYTES + 1)));
        assertTrue(huge.getMessage().contains("50MB"));
    }

    @Test
    void rejectsTextbookThatIsNotPdfOrExceedsOneHundredMegabytes() {
        assertThrows(ResourceBadRequestException.class,
                () -> validator.validateTextbook(file("book.docx", "application/pdf", new byte[] {'P', 'K'}, 20)));

        ResourceBadRequestException huge = assertThrows(ResourceBadRequestException.class,
                () -> validator.validateTextbook(pdfSized("book.pdf", LearningMaterialValidator.TEXTBOOK_MAX_BYTES + 1)));
        assertTrue(huge.getMessage().contains("100MB"));
    }

    @Test
    void acceptsJpegAndPngTocImagesAndRejectsOtherContent() {
        assertDoesNotThrow(() -> validator.validateTocImage(file(
                "toc.jpg", "image/jpeg", new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0}, 40)));
        assertDoesNotThrow(() -> validator.validateTocImage(file(
                "toc.png", "image/png", new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0, 0, 0, 0}, 40)));

        assertThrows(ResourceBadRequestException.class, () -> validator.validateTocImage(file(
                "toc.jpg", "image/jpeg", "%PDF".getBytes(), 4)));
        ResourceBadRequestException huge = assertThrows(ResourceBadRequestException.class,
                () -> validator.validateTocImage(file(
                        "toc.png",
                        "image/png",
                        new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47},
                        LearningMaterialValidator.TOC_IMAGE_MAX_BYTES + 1)));
        assertTrue(huge.getMessage().contains("10MB"));
    }

    private static MockMultipartFile pdf(String name, String mime) {
        return pdfSized(name, "%PDF-1.4".getBytes().length);
    }

    private static MockMultipartFile pdfSized(String name, long size) {
        return file(name, "application/pdf", "%PDF-1.4".getBytes(), size);
    }

    private static MockMultipartFile file(String name, String mime, byte[] content, long size) {
        return new MockMultipartFile("file", name, mime, content) {
            @Override
            public long getSize() {
                return size;
            }
        };
    }
}
