package com.vn.aitutor.controller;

import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.dto.request.ChangePasswordRequest;
import com.vn.aitutor.dto.request.UpdateRoleRequest;
import com.vn.aitutor.dto.request.UserCreateRequest;
import com.vn.aitutor.dto.request.UserUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.UserResponse;
import com.vn.aitutor.service.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<PageResponseDTO<UserResponse>> getAllProfile(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PageRequest pageRequest = PageRequest.of(page - 1, size);
        return ResponseEntity.ok(userService.getAllProfile(role, search, pageRequest));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<ApiResponse<UserResponse>> getProfileById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(userService.getProfileById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createProfile(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createProfile(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @PathVariable("id") UUID id, 
            @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.updateStatus(id));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable UUID id, 
            @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(userService.updateRole(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.deleteProfile(id));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(userService.changePassword(request));
    }

    @PostMapping("/{id}/avatar")
    @PreAuthorize("hasAuthority('ROLE_ADMIN') or @userSecurity.isOwner(authentication, #id)")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @PathVariable("id") UUID id, 
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(userService.uploadAvatar(id, file));
    }
}
