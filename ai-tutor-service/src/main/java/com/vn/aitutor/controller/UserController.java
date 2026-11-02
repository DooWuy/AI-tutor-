package com.vn.aitutor.controller;

import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.dto.request.user.ChangePasswordRequest;
import com.vn.aitutor.dto.request.user.UpdateRoleRequest;
import com.vn.aitutor.dto.request.user.UserCreateRequest;
import com.vn.aitutor.dto.request.user.UserUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.user.UserResponse;
import com.vn.aitutor.service.user.IUserService;
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

    @GetMapping("/accounts")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @io.swagger.v3.oas.annotations.Operation(summary = "Search non-deleted accounts (Admin only)")
    public ResponseEntity<PageResponseDTO<UserResponse>> searchAccounts(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        if (page < 1 || size < 1 || size > 50 || !java.util.Set.of("createdAt", "fullName", "username", "email").contains(sort)
                || !("asc".equals(direction) || "desc".equals(direction))) {
            throw new com.vn.aitutor.exception.ResourceBadRequestException("Phân trang hoặc sắp xếp không hợp lệ");
        }
        return ResponseEntity.ok(userService.searchAccounts(role, active, search,
                PageRequest.of(page - 1, size, org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.fromString(direction), sort).and(
                        org.springframework.data.domain.Sort.by("id")))));
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PUT, RequestMethod.PATCH})
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @io.swagger.v3.oas.annotations.Operation(summary = "Set account active state; repeated requests preserve the target state")
    public ResponseEntity<ApiResponse<UserResponse>> setStatus(@PathVariable UUID id,
            @Valid @RequestBody com.vn.aitutor.dto.request.user.AccountStatusRequest request) {
        return ResponseEntity.ok(userService.setStatus(id, request.active()));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<PageResponseDTO<UserResponse>> getAllProfile(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (page < 1 || size < 1 || size > 50) {
            throw new com.vn.aitutor.exception.ResourceBadRequestException(
                    "page phải >= 1 và size phải trong khoảng 1-50");
        }
        
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

    @PostMapping("/change-password/send-otp")
    public ResponseEntity<ApiResponse<String>> sendChangePasswordOtp() {
        return ResponseEntity.ok(userService.sendChangePasswordOtp());
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
