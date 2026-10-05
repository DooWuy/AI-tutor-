package com.vn.aitutor.service;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class LearningMaterialValidator {

    public static final long SUPPLEMENT_MAX_BYTES = 50L * 1024 * 1024;
    public static final long TEXTBOOK_MAX_BYTES = 100L * 1024 * 1024;
    public static final long TOC_IMAGE_MAX_BYTES = 10L * 1024 * 1024;

    private static final Set<String> SUPPLEMENT_EXTENSIONS = Set.of("pdf", "docx", "md", "txt");

    public void validateTextbook(MultipartFile file) {
        requirePresent(file, "Tệp sách PDF");
        if (file.getSize() > TEXTBOOK_MAX_BYTES) {
            throw new ResourceBadRequestException("Dung lượng file sách vượt quá giới hạn 100MB");
        }
        if (!"pdf".equals(extension(file)) || !looksLikePdf(file)) {
            throw new ResourceBadRequestException("Tệp sách chỉ chấp nhận định dạng PDF");
        }
    }

    public void validateSupplement(MultipartFile file) {
        requirePresent(file, "Tệp tài liệu");
        if (file.getSize() > SUPPLEMENT_MAX_BYTES) {
            throw new ResourceBadRequestException("Dung lượng file vượt quá giới hạn 50MB");
        }
        String extension = extension(file);
        if ("zip".equals(extension) || !SUPPLEMENT_EXTENSIONS.contains(extension)) {
            throw new ResourceBadRequestException("Chỉ chấp nhận file .pdf, .docx, .md, .txt");
        }
        if ("pdf".equals(extension) && !looksLikePdf(file)) {
            throw new ResourceBadRequestException("Nội dung file PDF không hợp lệ");
        }
        if ("docx".equals(extension) && !looksLikeZip(file)) {
            throw new ResourceBadRequestException("Nội dung file DOCX không hợp lệ");
        }
        assertMime(file, extension);
    }

    public void validateTocImage(MultipartFile file) {
        requirePresent(file, "Ảnh mục lục");
        if (file.getSize() > TOC_IMAGE_MAX_BYTES) {
            throw new ResourceBadRequestException("Dung lượng ảnh mục lục vượt quá giới hạn 10MB");
        }
        String extension = extension(file);
        if (!Set.of("jpg", "jpeg", "png").contains(extension)) {
            throw new ResourceBadRequestException("Ảnh mục lục chỉ chấp nhận .jpg, .jpeg, .png");
        }
        byte[] header = header(file, 8);
        boolean jpeg = header.length >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
        boolean png = header.length >= 4 && (header[0] & 0xFF) == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
        if (("png".equals(extension) && !png) || (!"png".equals(extension) && !jpeg)) {
            throw new ResourceBadRequestException("Nội dung ảnh mục lục không hợp lệ");
        }
    }

    private void assertMime(MultipartFile file, String extension) {
        String mime = file.getContentType();
        if (mime == null || mime.isBlank() || "application/octet-stream".equalsIgnoreCase(mime)) {
            return;
        }
        String expected = switch (extension) {
            case "pdf" -> "application/pdf";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "txt" -> "text/plain";
            case "md" -> mime.toLowerCase(Locale.ROOT).startsWith("text/") ? mime : "text/markdown";
            default -> mime;
        };
        if ("md".equals(extension) && mime.toLowerCase(Locale.ROOT).startsWith("text/")) {
            return;
        }
        if (!expected.equalsIgnoreCase(mime)) {
            throw new ResourceBadRequestException("Định dạng file không được hỗ trợ");
        }
    }

    private void requirePresent(MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            throw new ResourceBadRequestException(label + " không được để trống");
        }
    }

    private String extension(MultipartFile file) {
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) {
            return "";
        }
        return name.substring(dot + 1);
    }

    private boolean looksLikePdf(MultipartFile file) {
        byte[] header = header(file, 4);
        return header.length >= 4 && header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F';
    }

    private boolean looksLikeZip(MultipartFile file) {
        byte[] header = header(file, 2);
        return header.length >= 2 && header[0] == 'P' && header[1] == 'K';
    }

    private byte[] header(MultipartFile file, int length) {
        try (InputStream input = file.getInputStream()) {
            return input.readNBytes(length);
        } catch (IOException ex) {
            throw new ResourceBadRequestException("Không đọc được nội dung file");
        }
    }
}
