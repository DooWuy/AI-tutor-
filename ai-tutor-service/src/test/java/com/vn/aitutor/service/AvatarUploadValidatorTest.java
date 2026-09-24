package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vn.aitutor.exception.ResourceBadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

class AvatarUploadValidatorTest {

    private AvatarUploadValidator validator;

    @BeforeEach
    void setUp() {
        validator = new AvatarUploadValidator(DataSize.ofMegabytes(5));
    }

    @Test
    void acceptsPngWithMatchingMimeExtensionAndSignature() {
        MockMultipartFile avatar = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});

        assertDoesNotThrow(() -> validator.validate(avatar));
    }

    @Test
    void rejectsMimeTypeThatDoesNotMatchTheExtension() {
        MockMultipartFile avatar = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/jpeg",
                new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});

        assertThrows(ResourceBadRequestException.class, () -> validator.validate(avatar));
    }

    @Test
    void rejectsSpoofedImageContent() {
        MockMultipartFile avatar = new MockMultipartFile(
                "file",
                "avatar.webp",
                "image/webp",
                "not-an-image".getBytes());

        assertThrows(ResourceBadRequestException.class, () -> validator.validate(avatar));
    }

    @Test
    void rejectsFilesLargerThanConfiguredLimit() {
        byte[] content = new byte[(int) DataSize.ofMegabytes(5).toBytes() + 1];
        content[0] = (byte) 0xFF;
        content[1] = (byte) 0xD8;
        content[2] = (byte) 0xFF;
        MockMultipartFile avatar = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", content);

        assertThrows(ResourceBadRequestException.class, () -> validator.validate(avatar));
    }
}
