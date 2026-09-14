package com.vn.aitutor.service;

import com.vn.aitutor.domain.enums.Role;
import com.vn.aitutor.dto.request.*;
import com.vn.aitutor.dto.response.*;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.util.UUID;

public interface IUserService {
    PageResponseDTO<UserResponse> getAllProfile(Role role, String search, PageRequest pageRequest) throws ResourceConflictException, ResourceBadRequestException, ResourceForbiddenException;
    ApiResponse<UserResponse> getProfileById(UUID id) throws ResourceConflictException, ResourceNotFoundException;
    ApiResponse<UserResponse> createProfile(UserCreateRequest userCreateRequest) throws ResourceConflictException, ResourceBadRequestException, ResourceForbiddenException;
    ApiResponse<UserResponse> updateProfile(UUID id, UserUpdateRequest userUpdateRequest) throws ResourceConflictException, ResourceNotFoundException, ResourceForbiddenException;
    ApiResponse<UserResponse> updateStatus(UUID id) throws ResourceConflictException, ResourceNotFoundException, ResourceForbiddenException;
    ApiResponse<UserResponse> updateRole(UUID id, UpdateRoleRequest request) throws ResourceConflictException, ResourceNotFoundException, ResourceForbiddenException, ResourceBadRequestException;
    ApiResponse<String> deleteProfile(UUID id) throws ResourceConflictException, ResourceNotFoundException, ResourceForbiddenException;
    ApiResponse<String> changePassword(ChangePasswordRequest request) throws ResourceBadRequestException;
    ApiResponse<String> uploadAvatar(UUID userId, MultipartFile file) throws ResourceNotFoundException, IOException, ResourceForbiddenException;
}
