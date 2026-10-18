package com.vn.aitutor.service.system;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.vn.aitutor.exception.IngestionException;
import com.vn.aitutor.service.system.CloudinaryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    private CloudinaryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CloudinaryServiceImpl(cloudinary);
    }

    @Test
    void uploadImage_returnsSecureUrl() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "fake-bytes".getBytes());
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(Map.of("secure_url", "https://res.cloudinary.com/demo/image/upload/sample.jpg"));

        String url = service.uploadImage(file);

        assertNotNull(url);
        assertEquals("https://res.cloudinary.com/demo/image/upload/sample.jpg", url);
        verify(uploader).upload(any(byte[].class), anyMap());
    }

    @Test
    void materialize_blankPath_throwsIngestionException() {
        assertThrows(IngestionException.class, () -> service.materialize("   "));
        assertThrows(IngestionException.class, () -> service.materialize(null));
    }

    @Test
    void materialize_localPath_returnsFile() throws IOException {
        File file = service.materialize("/uploads/documents/test.pdf");
        assertNotNull(file);
        assertEquals("uploads\\documents\\test.pdf".replace('/', File.separatorChar), file.getPath());
    }

    @Test
    void deleteStoredFile_blankPath_doesNothing() {
        assertDoesNotThrow(() -> service.deleteStoredFile(null));
        assertDoesNotThrow(() -> service.deleteStoredFile("   "));
    }
}
