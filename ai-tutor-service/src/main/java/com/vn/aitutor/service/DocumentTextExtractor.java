package com.vn.aitutor.service;

import com.vn.aitutor.exception.IngestionException;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DocumentTextExtractor {

    public static final String LATEX_INSTRUCTION =
            "Giữ nguyên mọi công thức toán, lý, hóa dưới dạng LaTeX ($...$ hoặc $$...$$). "
                    + "Không đổi công thức thành ảnh hay ký tự xấp xỉ.";

    private final ILlamaParseService llamaParseService;

    public String extract(File file) {
        return extract(file, file == null ? null : file.getName());
    }

    /**
     * Cloudinary raw URLs drop the original extension, so the downloaded temp file is often {@code .bin}.
     * Classification uses {@code originalName} (the stored document file name).
     */
    public String extract(File file, String originalName) {
        String name = classifyName(originalName, file);
        try {
            if (name.endsWith(".md") || name.endsWith(".txt")) {
                return Files.readString(file.toPath(), StandardCharsets.UTF_8);
            }
            File toParse = presentWithOriginalExtension(file, name);
            boolean copied = !toParse.equals(file);
            try {
                return llamaParseService.parseFileToMarkdown(toParse, LATEX_INSTRUCTION);
            } finally {
                if (copied) {
                    Files.deleteIfExists(toParse.toPath());
                }
            }
        } catch (IngestionException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IngestionException("Không bóc tách được văn bản: " + ex.getMessage(), ex);
        }
    }

    private static String classifyName(String originalName, File file) {
        String source = originalName;
        if (source == null || source.isBlank()) {
            source = file.getName();
        }
        int slash = Math.max(source.lastIndexOf('/'), source.lastIndexOf('\\'));
        if (slash >= 0 && slash < source.length() - 1) {
            source = source.substring(slash + 1);
        }
        return source.toLowerCase(Locale.ROOT);
    }

    private static File presentWithOriginalExtension(File file, String lowerName) throws IOException {
        String extension = extensionOf(lowerName);
        if (extension == null || file.getName().toLowerCase(Locale.ROOT).endsWith(extension)) {
            return file;
        }
        File copy = File.createTempFile("aitutor-parse-", extension);
        Files.copy(file.toPath(), copy.toPath(), StandardCopyOption.REPLACE_EXISTING);
        return copy;
    }

    private static String extensionOf(String lowerName) {
        int dot = lowerName.lastIndexOf('.');
        if (dot <= 0 || dot == lowerName.length() - 1) {
            return null;
        }
        String extension = lowerName.substring(dot);
        if (!extension.matches("\\.[a-z0-9]{1,8}")) {
            return null;
        }
        return extension;
    }
}
