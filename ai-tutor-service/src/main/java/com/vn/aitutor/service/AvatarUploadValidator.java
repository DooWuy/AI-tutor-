package com.vn.aitutor.service;

import com.vn.aitutor.exception.ResourceBadRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

/** Validates avatar uploads before bytes are sent to Cloudinary. */
@Component
public class AvatarUploadValidator {

    private static final Map<String, Set<String>> ALLOWED_EXTENSIONS_BY_CONTENT_TYPE = Map.of(
            MediaType.IMAGE_JPEG_VALUE, Set.of("jpg", "jpeg"),
            MediaType.IMAGE_PNG_VALUE, Set.of("png"),
            "image/webp", Set.of("webp"));

    private final DataSize maxFileSize;

    public AvatarUploadValidator(@Value("${app.avatar.max-file-size:5MB}") DataSize maxFileSize) {
        this.maxFileSize = maxFileSize;
    }

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResourceBadRequestException("File trống");
        }
        if (file.getSize() > maxFileSize.toBytes()) {
            throw new ResourceBadRequestException("Ảnh đại diện không được vượt quá " + maxFileSize.toMegabytes() + " MB");
        }

        String contentType = normalizeContentType(file.getContentType());
        Set<String> permittedExtensions = ALLOWED_EXTENSIONS_BY_CONTENT_TYPE.get(contentType);
        if (permittedExtensions == null) {
            throw new ResourceBadRequestException("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!permittedExtensions.contains(extension)) {
            throw new ResourceBadRequestException("MIME type và phần mở rộng ảnh không khớp");
        }
        validateSignature(file, contentType);
    }

    private String normalizeContentType(String contentType) {
        return StringUtils.hasText(contentType) ? contentType.toLowerCase(Locale.ROOT).trim() : "";
    }

    private String getExtension(String originalFilename) {
        if (!StringUtils.hasText(originalFilename)) {
            return "";
        }
        String cleanName = StringUtils.cleanPath(originalFilename);
        int extensionSeparator = cleanName.lastIndexOf('.');
        if (extensionSeparator < 1 || extensionSeparator == cleanName.length() - 1) {
            return "";
        }
        return cleanName.substring(extensionSeparator + 1).toLowerCase(Locale.ROOT);
    }

    private void validateSignature(MultipartFile file, String contentType) {
        try (InputStream inputStream = file.getInputStream()) {
            byte[] header = inputStream.readNBytes(12);
            boolean valid = switch (contentType) {
                case MediaType.IMAGE_JPEG_VALUE -> isJpeg(header);
                case MediaType.IMAGE_PNG_VALUE -> isPng(header);
                case "image/webp" -> isWebp(header);
                default -> false;
            };
            if (!valid) {
                throw new ResourceBadRequestException("Nội dung file không khớp với định dạng ảnh đã khai báo");
            }
        } catch (IOException exception) {
            throw new ResourceBadRequestException("Không thể đọc file ảnh");
        }
    }

    private boolean isJpeg(byte[] header) {
        return header.length >= 3 && header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF;
    }

    private boolean isPng(byte[] header) {
        byte[] signature = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        if (header.length < signature.length) {
            return false;
        }
        for (int index = 0; index < signature.length; index++) {
            if (header[index] != signature[index]) {
                return false;
            }
        }
        return true;
    }

    private boolean isWebp(byte[] header) {
        return header.length >= 12
                && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
    }
}
