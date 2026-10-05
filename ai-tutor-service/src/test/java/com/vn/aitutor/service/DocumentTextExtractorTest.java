package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DocumentTextExtractorTest {

    @Mock
    private ILlamaParseService llamaParseService;
    @InjectMocks
    private DocumentTextExtractor extractor;

    @Test
    void plainTextIsReadEvenWhenTheTempFileHasABinSuffix() throws Exception {
        File bin = File.createTempFile("aitutor-", ".bin");
        try {
            String body = "nội dung $$\\int_a^b$$";
            Files.writeString(bin.toPath(), body, StandardCharsets.UTF_8);

            String text = extractor.extract(bin, "lesson-note.txt");

            assertEquals(body, text);
            verify(llamaParseService, never()).parseFileToMarkdown(any(), any());
        } finally {
            Files.deleteIfExists(bin.toPath());
        }
    }

    @Test
    void pdfIsCopiedToAPdfNameBeforeLlamaParse() throws Exception {
        File bin = File.createTempFile("aitutor-", ".bin");
        byte[] bytes = new byte[] {'%', 'P', 'D', 'F'};
        Files.write(bin.toPath(), bytes);
        AtomicReference<File> seen = new AtomicReference<>();
        when(llamaParseService.parseFileToMarkdown(any(), eq(DocumentTextExtractor.LATEX_INSTRUCTION)))
                .thenAnswer(invocation -> {
                    File file = invocation.getArgument(0);
                    seen.set(file);
                    assertTrue(file.getName().toLowerCase(Locale.ROOT).endsWith(".pdf"));
                    assertArrayEquals(bytes, Files.readAllBytes(file.toPath()));
                    return "markdown";
                });
        try {
            assertEquals("markdown", extractor.extract(bin, "EXT01.pdf"));
        } finally {
            Files.deleteIfExists(bin.toPath());
        }
        assertFalse(seen.get().exists());
    }
}
