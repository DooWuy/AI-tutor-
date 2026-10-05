package com.vn.aitutor.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.io.File;

public interface ICloudinaryService {
    String uploadImage(MultipartFile file) throws IOException;
    String uploadDocument(MultipartFile file) throws IOException;
    String uploadDocumentBytes(byte[] content, String originalFilename) throws IOException;
    void deleteStoredFile(String filePath);
    File materialize(String filePath) throws IOException;
}
