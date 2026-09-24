package com.vn.aitutor.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vn.aitutor.service.ICloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements ICloudinaryService {

    private final Cloudinary cloudinary;

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
}
