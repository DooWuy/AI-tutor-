package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.user.StudentProfileUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.user.StudentProfileResponse;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.user.IStudentProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class StudentProfileControllerTest {

    @Mock
    private IStudentProfileService studentProfileService;

    private StudentProfileController controller;
    private UserPrincipal principal;
    private UUID userId;

    @BeforeEach
    void setUp() {
        controller = new StudentProfileController(studentProfileService);
        userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        principal = UserPrincipal.builder().users(user).build();
    }

    @Test
    void getMyProfile_returnsProfile() {
        StudentProfileResponse profile = StudentProfileResponse.builder()
                .userId(userId)
                .fullName("Nguyen Van A")
                .build();

        when(studentProfileService.getMyProfile(userId)).thenReturn(ApiResponse.<StudentProfileResponse>builder()
                .success(true)
                .data(profile)
                .build());

        ResponseEntity<ApiResponse<StudentProfileResponse>> response = controller.getMyProfile(principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Nguyen Van A", response.getBody().getData().getFullName());
    }

    @Test
    void updateMyProfile_returnsUpdatedProfile() {
        StudentProfileUpdateRequest request = new StudentProfileUpdateRequest();
        StudentProfileResponse profile = StudentProfileResponse.builder()
                .userId(userId)
                .fullName("Nguyen Van A Updated")
                .build();

        when(studentProfileService.updateMyProfile(userId, request)).thenReturn(ApiResponse.<StudentProfileResponse>builder()
                .success(true)
                .data(profile)
                .build());

        ResponseEntity<ApiResponse<StudentProfileResponse>> response = controller.updateMyProfile(principal, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Nguyen Van A Updated", response.getBody().getData().getFullName());
    }

    @Test
    void uploadMyAvatar_returnsAvatarUrl() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "image".getBytes());
        StudentProfileResponse profile = StudentProfileResponse.builder()
                .avatarUrl("https://cloudinary.com/avatar.jpg")
                .build();

        when(studentProfileService.uploadMyAvatar(userId, file)).thenReturn(ApiResponse.<StudentProfileResponse>builder()
                .success(true)
                .data(profile)
                .build());

        ResponseEntity<ApiResponse<StudentProfileResponse>> response = controller.uploadMyAvatar(principal, file);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("https://cloudinary.com/avatar.jpg", response.getBody().getData().getAvatarUrl());
    }
}
