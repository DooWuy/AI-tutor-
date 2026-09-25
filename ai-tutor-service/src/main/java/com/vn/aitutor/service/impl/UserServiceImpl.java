package com.vn.aitutor.service.impl;

import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.Teacher;
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
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.IMailService;
import com.vn.aitutor.service.ISchoolClassService;
import com.vn.aitutor.service.IUserService;
import com.vn.aitutor.service.ICloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import com.vn.aitutor.entity.PasswordResetToken;
import com.vn.aitutor.repository.PasswordResetTokenRepository;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;
    private final IMailService mailService;
    private final ICloudinaryService cloudinaryService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ISchoolClassService schoolClassService;

    @Override
    public PageResponseDTO<UserResponse> getAllProfile(Role role, String search, PageRequest pageRequest) {
        Page<User> usersPage = userRepository.searchUsers(role, search, pageRequest);

        List<UserResponse> items = usersPage.getContent().stream()
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

        if (request.getRole() == Role.STUDENT) {
            if (request.getSchoolName() == null || request.getSchoolName().isBlank()) {
                throw new ResourceBadRequestException("Tên trường học không được để trống đối với học sinh");
            }
            if (request.getGradeLevel() == null || request.getGradeLevel().isBlank()) {
                throw new ResourceBadRequestException("Khối lớp không được để trống đối với học sinh");
            }
            Student student = new Student();
            student.setUser(savedUser);
            student.setStudentCode(generateUniqueStudentCode());
            student.setSchoolName(request.getSchoolName());
            student.setGradeLevel(request.getGradeLevel());
            student.setClassName(request.getClassName());
            student.setEmail(request.getEmail());
            if (StringUtils.hasText(request.getClassName())) {
                student.setClassEntity(schoolClassService.findOrCreate(
                        request.getSchoolName(), request.getGradeLevel(), request.getClassName()));
            }
            studentRepository.save(student);
        } else if (request.getRole() == Role.TEACHER) {
            if (request.getDepartment() == null || request.getDepartment().isBlank()) {
                throw new ResourceBadRequestException("Phòng ban/Khoa không được để trống đối với giáo viên");
            }
            if (request.getSubjectTaught() == null || request.getSubjectTaught().isBlank()) {
                throw new ResourceBadRequestException("Môn học giảng dạy không được để trống đối với giáo viên");
            }
            Teacher teacher = new Teacher();
            teacher.setUser(savedUser);
            teacher.setTeacherCode(generateUniqueTeacherCode());
            teacher.setDepartment(request.getDepartment());
            teacher.setSubjectTaught(request.getSubjectTaught());
            teacher.setSchoolName(request.getSchoolName());
            teacherRepository.save(teacher);
        }

        // Tạo Token thiết lập mật khẩu
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(savedUser)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .isUsed(false)
                .build();
        passwordResetTokenRepository.save(resetToken);

        // Gửi email yêu cầu thiết lập mật khẩu
        mailService.sendAccountSetupEmail(
                savedUser.getEmail(), 
                savedUser.getFullName(), 
                savedUser.getUsername(), 
                token
        );

        return ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Tạo hồ sơ thành công")
                .data(mapToUserResponse(savedUser))
                .build();
    }

    private String generateUniqueStudentCode() {
        String code;
        do {
            code = "STU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (studentRepository.existsByStudentCode(code));
        return code;
    }

    private String generateUniqueTeacherCode() {
        String code;
        do {
            code = "TEA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (teacherRepository.existsByTeacherCode(code));
        return code;
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

        if (user.getRole() == Role.STUDENT) {
            studentRepository.findByUserId(user.getId()).ifPresent(student -> {
                if (request.getSchoolName() != null) student.setSchoolName(request.getSchoolName());
                if (request.getGradeLevel() != null) student.setGradeLevel(request.getGradeLevel());
                if (request.getClassName() != null) {
                    student.setClassName(request.getClassName());
                    if (StringUtils.hasText(request.getClassName())) {
                        student.setClassEntity(schoolClassService.findOrCreate(
                                student.getSchoolName(), student.getGradeLevel(), request.getClassName()));
                    }
                }
                studentRepository.save(student);
            });
        } else if (user.getRole() == Role.TEACHER) {
            teacherRepository.findByUserId(user.getId()).ifPresent(teacher -> {
                if (request.getDepartment() != null) teacher.setDepartment(request.getDepartment());
                if (request.getSubjectTaught() != null) teacher.setSubjectTaught(request.getSubjectTaught());
                if (request.getSchoolName() != null) teacher.setSchoolName(request.getSchoolName());
                teacherRepository.save(teacher);
            });
        }

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
        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResourceBadRequestException("Chỉ cho phép tải lên file ảnh (JPEG, PNG, v.v...)");
        }

        // Upload ảnh lên Cloudinary
        String avatarUrl = cloudinaryService.uploadImage(file);

        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        return ApiResponse.<String>builder()
                .success(true)
                .message("Tải ảnh đại diện lên thành công")
                .data(avatarUrl)
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
