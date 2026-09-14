package com.vn.aitutor.service.impl;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.dto.request.ChangePasswordRequest;
import com.vn.aitutor.dto.request.UpdateRoleRequest;
import com.vn.aitutor.dto.request.UserCreateRequest;
import com.vn.aitutor.dto.request.UserUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.UserResponse;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public PageResponseDTO<UserResponse> getAllProfile(Role role, String search, PageRequest pageRequest) {
        Page<User> usersPage;
        usersPage = userRepository.findAll(pageRequest);

        List<UserResponse> items = usersPage.getContent().stream()
                .filter(u -> !u.isDeleted())
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> !StringUtils.hasText(search) || u.getFullName().toLowerCase().contains(search.toLowerCase()) || u.getEmail().toLowerCase().contains(search.toLowerCase()))
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());

        return PageResponseDTO.<UserResponse>builder()
                .content(items)
                .page(usersPage.getNumber() + 1)
                .size(usersPage.getSize())
                .totalElements(usersPage.getTotalElements())
                .totalPages(usersPage.getTotalPages())
                .build();
    }

    @Override
    public ApiResponse<UserResponse> getProfileById(UUID id) {
        User user = getUserById(id);
        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Thành công")
                .data(mapToUserResponse(user))
                .build();
    }

    @Override
    public ApiResponse<UserResponse> createProfile(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceConflictException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceConflictException("Email đã được sử dụng");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setGender(Gender.OTHER);
        user.setActive(true);

        User savedUser = userRepository.save(user);

        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Tạo hồ sơ thành công")
                .data(mapToUserResponse(savedUser))
                .build();
    }

    @Override
    public ApiResponse<UserResponse> updateProfile(UUID id, UserUpdateRequest request) {
        User user = getUserById(id);
        
        user.setFullName(request.getFullName());
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        User updatedUser = userRepository.save(user);

        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Cập nhật hồ sơ thành công")
                .data(mapToUserResponse(updatedUser))
                .build();
    }

    @Override
    public ApiResponse<UserResponse> updateStatus(UUID id) {
        User user = getUserById(id);
        user.setActive(!user.isActive());
        User updatedUser = userRepository.save(user);

        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message(user.isActive() ? "User activated" : "User deactivated")
                .data(mapToUserResponse(updatedUser))
                .build();
    }

    @Override
    public ApiResponse<UserResponse> updateRole(UUID id, UpdateRoleRequest request) {
        User user = getUserById(id);
        user.setRole(request.getRole());
        User updatedUser = userRepository.save(user);

        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Cập nhật vai trò thành công")
                .data(mapToUserResponse(updatedUser))
                .build();
    }

    @Override
    public ApiResponse<String> deleteProfile(UUID id) {
        User user = getUserById(id);
        user.setDeleted(true);
        userRepository.save(user);

        return ApiResponse.<String>builder()
                .success(true)
                .message("Xóa người dùng thành công")
                .data(null)
                .build();
    }

    @Override
    public ApiResponse<String> changePassword(ChangePasswordRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + currentUsername));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new ResourceBadRequestException("Mật khẩu cũ không chính xác");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ResourceBadRequestException("Mật khẩu mới và mật khẩu xác nhận không khớp");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ApiResponse.<String>builder()
                .success(true)
                .message("Đổi mật khẩu thành công")
                .data(null)
                .build();
    }

    @Override
    public ApiResponse<String> uploadAvatar(UUID userId, MultipartFile file) throws IOException {
        User user = getUserById(userId);
        
        if (file.isEmpty()) {
            throw new ResourceBadRequestException("File trống");
        }

        String uploadDir = "uploads/avatars/";
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir + fileName);
        Files.write(filePath, file.getBytes());

        user.setAvatarUrl(uploadDir + fileName);
        userRepository.save(user);

        return ApiResponse.<String>builder()
                .success(true)
                .message("Tải ảnh đại diện lên thành công")
                .data(uploadDir + fileName)
                .build();
    }

    private User getUserById(UUID id) {
        return userRepository.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với id: " + id));
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .dateOfBirth(user.getDateOfBirth())
                .active(user.isActive())
                .isDeleted(user.isDeleted())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
