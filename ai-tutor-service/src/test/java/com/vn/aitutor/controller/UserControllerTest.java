package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.user.ChangePasswordRequest;
import com.vn.aitutor.dto.request.user.UpdateRoleRequest;
import com.vn.aitutor.dto.request.user.UserCreateRequest;
import com.vn.aitutor.dto.request.user.UserUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.user.UserResponse;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.service.user.IUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private IUserService userService;

    private UserController userController;

    @BeforeEach
    void setUp() {
        userController = new UserController(userService);
    }

    @Test
    void getAllProfile_returnsPagedUsers() {
        PageResponseDTO<UserResponse> pageResponse = PageResponseDTO.<UserResponse>builder()
                .content(List.of(UserResponse.builder().username("testuser").build()))
                .page(1)
                .size(10)
                .totalElements(1L)
                .totalPages(1)
                .build();

        when(userService.getAllProfile(eq(Role.STUDENT), eq("test"), any(PageRequest.class)))
                .thenReturn(pageResponse);

        ResponseEntity<PageResponseDTO<UserResponse>> response =
                userController.getAllProfile(Role.STUDENT, "test", 1, 10);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());
        assertEquals("testuser", response.getBody().getContent().get(0).getUsername());
    }

    @Test
    void getProfileById_returnsUser() {
        UUID id = UUID.randomUUID();
        UserResponse userResponse = UserResponse.builder().userId(id).username("user1").build();
        when(userService.getProfileById(id)).thenReturn(ApiResponse.<UserResponse>builder()
                .success(true)
                .data(userResponse)
                .build());

        ResponseEntity<ApiResponse<UserResponse>> response = userController.getProfileById(id);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(id, response.getBody().getData().getUserId());
    }

    @Test
    void createProfile_returnsCreated() {
        UserCreateRequest request = new UserCreateRequest();
        UserResponse userResponse = UserResponse.builder().username("newuser").build();
        when(userService.createProfile(request)).thenReturn(ApiResponse.<UserResponse>builder()
                .success(true)
                .data(userResponse)
                .build());

        ResponseEntity<ApiResponse<UserResponse>> response = userController.createProfile(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("newuser", response.getBody().getData().getUsername());
    }

    @Test
    void updateProfile_returnsSuccess() {
        UUID id = UUID.randomUUID();
        UserUpdateRequest request = new UserUpdateRequest();
        when(userService.updateProfile(id, request)).thenReturn(ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Cập nhật thành công")
                .build());

        ResponseEntity<ApiResponse<UserResponse>> response = userController.updateProfile(id, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void updateStatus_returnsSuccess() {
        UUID id = UUID.randomUUID();
        when(userService.updateStatus(id)).thenReturn(ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Cập nhật trạng thái thành công")
                .build());

        ResponseEntity<ApiResponse<UserResponse>> response = userController.updateStatus(id);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void updateRole_returnsSuccess() {
        UUID id = UUID.randomUUID();
        UpdateRoleRequest request = new UpdateRoleRequest();
        when(userService.updateRole(id, request)).thenReturn(ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Cập nhật vai trò thành công")
                .build());

        ResponseEntity<ApiResponse<UserResponse>> response = userController.updateRole(id, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void deleteProfile_returnsSuccess() {
        UUID id = UUID.randomUUID();
        when(userService.deleteProfile(id)).thenReturn(ApiResponse.<String>builder()
                .success(true)
                .message("Xóa thành công")
                .build());

        ResponseEntity<ApiResponse<String>> response = userController.deleteProfile(id);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void sendChangePasswordOtp_returnsSuccess() {
        when(userService.sendChangePasswordOtp()).thenReturn(ApiResponse.<String>builder()
                .success(true)
                .message("Mã xác nhận đã gửi")
                .build());

        ResponseEntity<ApiResponse<String>> response = userController.sendChangePasswordOtp();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }

    @Test
    void changePassword_returnsSuccess() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        when(userService.changePassword(request)).thenReturn(ApiResponse.<String>builder()
                .success(true)
                .message("Đổi mật khẩu thành công")
                .build());

        ResponseEntity<ApiResponse<String>> response = userController.changePassword(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
    }
}
