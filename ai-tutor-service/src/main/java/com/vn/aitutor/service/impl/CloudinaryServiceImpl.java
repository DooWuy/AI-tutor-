package com.vn.aitutor.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vn.aitutor.exception.IngestionException;
import com.vn.aitutor.service.ICloudinaryService;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements ICloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:demo}")
    private String cloudName;

    @Override
    public String uploadImage(MultipartFile file) throws IOException {
        String publicId = UUID.randomUUID().toString();

        Map<String, Object> uploadParams = ObjectUtils.asMap(
                "public_id", publicId,
                "folder", "ai_tutor_avatars",
                "resource_type", "image",
                "allowed_formats", List.of("jpg", "jpeg", "png", "webp"),
                "overwrite", false,
                "secure", true
        );

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
        return uploadResult.get("secure_url").toString();
    }

    @Override
    public String uploadDocument(MultipartFile file) throws IOException {
        return uploadDocumentBytes(file.getBytes(), file.getOriginalFilename());
    }

    @Override
    public String uploadDocumentBytes(byte[] content, String originalFilename) throws IOException {
        String safeName = sanitize(originalFilename);
        if (cloudEnabled()) {
            String publicId = "ai_tutor_documents/" + UUID.randomUUID() + "_" + stripExtension(safeName);
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", "raw",
                    "overwrite", false);
            Map<?, ?> uploadResult = cloudinary.uploader().upload(content, uploadParams);
            return uploadResult.get("secure_url").toString();
        }
        String fileName = UUID.randomUUID() + "_" + safeName;
        File directory = new File("uploads/documents");
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IOException("Không tạo được thư mục lưu tài liệu");
        }
        File dest = new File(directory, fileName);
        Files.write(dest.toPath(), content);
        return "/uploads/documents/" + fileName;
    }

    @Override
    public void deleteStoredFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
                deleteRemote(filePath);
                return;
            }
            File file = materialize(filePath);
            if (file.exists()) {
                if (!file.delete()) {
                    log.warn("Không xóa được file {}", file.getPath());
                }
            } else {
                log.info("File đã không còn trên đĩa: {}", filePath);
            }
        } catch (Exception ex) {
            log.warn("Không dọn được file {}: {}", filePath, ex.getMessage());
        }
    }

    @Override
    public File materialize(String filePath) throws IOException {
        if (filePath == null || filePath.isBlank()) {
            throw new IngestionException("Không có đường dẫn file");
        }
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            String suffix = filePath.toLowerCase(Locale.ROOT).contains(".pdf") ? ".pdf" : ".bin";
            File temp = File.createTempFile("aitutor-", suffix);
            try (InputStream input = URI.create(filePath).toURL().openStream()) {
                Files.copy(input, temp.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }
            return temp;
        }
        if (filePath.startsWith("/")) {
            return new File(filePath.substring(1));
        }
        return new File(filePath);
    }

    private void deleteRemote(String filePath) throws Exception {
        if (!cloudEnabled() || !filePath.contains("cloudinary")) {
            return;
        }
        String publicId = cloudinaryPublicId(filePath);
        if (publicId == null) {
            return;
        }
        cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "raw"));
    }

    private boolean cloudEnabled() {
        return cloudName != null && !cloudName.isBlank() && !"demo".equalsIgnoreCase(cloudName);
    }

    private String cloudinaryPublicId(String url) {
        int marker = url.indexOf("/upload/");
        if (marker < 0) {
            return null;
        }
        String rest = url.substring(marker + "/upload/".length()).replaceFirst("^v\\d+/", "");
        int query = rest.indexOf('?');
        if (query >= 0) {
            rest = rest.substring(0, query);
        }
        return rest;
    }

    private String sanitize(String originalFilename) {
        String name = originalFilename == null || originalFilename.isBlank() ? "document.bin" : originalFilename;
        return name.replaceAll("[\\\\/]+", "_");
    }

    private String stripExtension(String name) {
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(0, dot) : name;
    }
}
