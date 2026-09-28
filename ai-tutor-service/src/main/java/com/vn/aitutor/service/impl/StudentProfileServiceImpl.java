package com.vn.aitutor.service.impl;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.StudentProfileResponse;
import com.vn.aitutor.dto.request.StudentProfileUpdateRequest;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ProfileNotFoundException;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.AvatarUploadValidator;
import com.vn.aitutor.service.ICloudinaryService;
import com.vn.aitutor.service.IStudentProfileService;
import com.vn.aitutor.exception.ResourceBadRequestException;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class StudentProfileServiceImpl implements IStudentProfileService {
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final AvatarUploadValidator avatarUploadValidator;
    private final ICloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<StudentProfileResponse> getMyProfile(UUID userId) {
        StudentProfileContext context = loadCurrentStudent(userId);
        return successResponse(mapToResponse(context.user(), context.student()), "Lấy hồ sơ học sinh thành công");
    }

    @Override
    @Transactional
    public ApiResponse<StudentProfileResponse> updateMyProfile(UUID userId, StudentProfileUpdateRequest request) {
        StudentProfileContext context = loadCurrentStudent(userId);
        validateUpdate(request);
        User user = context.user();
        Student student = context.student();

        if (request.isSupplied("fullName")) user.setFullName(normalizeRequired(request.getFullName(), "Họ và tên"));
        if (request.isSupplied("dateOfBirth")) user.setDateOfBirth(request.getDateOfBirth());
        if (request.isSupplied("gender")) user.setGender(request.getGender());
        if (request.isSupplied("phoneNumber")) user.setPhoneNumber(normalizeOptional(request.getPhoneNumber()));
        if (request.isSupplied("gradeLevel")) student.setGradeLevel(normalizeRequired(request.getGradeLevel(), "Khối lớp"));
        if (request.isSupplied("className")) student.setClassName(normalizeOptional(request.getClassName()));
        if (request.isSupplied("studyPreferences")) {
            student.setStudyPreferences(request.getStudyPreferences() == null ? Map.of() : request.getStudyPreferences());
        }
        userRepository.save(user);
        studentRepository.save(student);
        return successResponse(mapToResponse(user, student), "Cập nhật hồ sơ học sinh thành công");
    }

    @Override
    @Transactional
    public ApiResponse<StudentProfileResponse> uploadMyAvatar(UUID userId, MultipartFile file) throws IOException {
        StudentProfileContext context = loadCurrentStudent(userId);
        avatarUploadValidator.validate(file);
        final String avatarUrl;
        try {
            avatarUrl = cloudinaryService.uploadImage(file);
        } catch (IOException | RuntimeException exception) {
            throw new ResourceBadRequestException("Không thể tải ảnh đại diện lên máy chủ lưu trữ");
        }
        context.user().setAvatarUrl(avatarUrl);
        userRepository.save(context.user());
        return successResponse(mapToResponse(context.user(), context.student()), "Tải ảnh đại diện lên thành công");
    }

    private StudentProfileContext loadCurrentStudent(UUID userId) {
        User user = userRepository.findById(userId)
                .filter(candidate -> !candidate.isDeleted() && candidate.isActive())
                .orElseThrow(() -> new ProfileNotFoundException("Không tìm thấy tài khoản hiện tại"));
        if (user.getRole() != Role.STUDENT) {
            throw new ProfileNotFoundException("Tài khoản hiện tại không phải là học sinh");
        }
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ProfileNotFoundException("Hồ sơ học sinh chưa được khởi tạo"));
        return new StudentProfileContext(user, student);
    }

    private StudentProfileResponse mapToResponse(User user, Student student) {
        return StudentProfileResponse.builder()
                .userId(user.getId())
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .gradeLevel(student.getGradeLevel())
                .className(student.getClassName() != null ? student.getClassName()
                        : student.getClassEntity() == null ? null : student.getClassEntity().getName())
                .schoolName(student.getSchoolName())
                .studyPreferences(student.getStudyPreferences())
                .totalXp(student.getTotalXp())
                .currentLevel(student.getCurrentLevel())
                .currentStreak(student.getCurrentStreak())
                .build();
    }

    private ApiResponse<StudentProfileResponse> successResponse(StudentProfileResponse response, String message) {
        return ApiResponse.<StudentProfileResponse>builder()
                .success(true)
                .message(message).data(response)
                .build();
    }

    private void validateUpdate(StudentProfileUpdateRequest request) {
        if (!request.getUnsupportedFields().isEmpty()) {
            throw new ResourceBadRequestException("Trường hồ sơ không được phép cập nhật: "
                    + String.join(", ", request.getUnsupportedFields().keySet()));
        }
        if (request.isSupplied("fullName") && (!StringUtils.hasText(request.getFullName()) || request.getFullName().trim().length() > 255)) {
            throw new ResourceBadRequestException("Họ và tên không được rỗng và tối đa 255 ký tự");
        }
        if (request.isSupplied("dateOfBirth") && request.getDateOfBirth() != null && request.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new ResourceBadRequestException("Ngày sinh không được ở tương lai");
        }
        if (request.isSupplied("phoneNumber") && StringUtils.hasText(request.getPhoneNumber())
                && !request.getPhoneNumber().matches("^(0|\\+84)(\\s|\\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\\d)(\\s|\\.)?(\\d{3})(\\s|\\.)?(\\d{3})$")) {
            throw new ResourceBadRequestException("Số điện thoại không hợp lệ");
        }
        if (request.isSupplied("gradeLevel") && (!StringUtils.hasText(request.getGradeLevel()) || request.getGradeLevel().trim().length() > 32)) {
            throw new ResourceBadRequestException("Khối lớp không được rỗng và tối đa 32 ký tự");
        }
        if (request.isSupplied("className") && request.getClassName() != null && request.getClassName().trim().length() > 64) {
            throw new ResourceBadRequestException("Tên lớp tối đa 64 ký tự");
        }
        if (request.isSupplied("studyPreferences")) validateStudyPreferences(request.getStudyPreferences());
    }

    private void validateStudyPreferences(Map<String, Object> preferences) {
        if (preferences == null) return;
        if (preferences.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 8192) {
            throw new ResourceBadRequestException("studyPreferences không được vượt quá 8 KB");
        }
        preferences.forEach((key, value) -> {
            if (!isPrimitiveOrPrimitiveArray(value)) {
                throw new ResourceBadRequestException("studyPreferences chỉ được chứa primitive hoặc mảng primitive");
            }
        });
    }

    private boolean isPrimitiveOrPrimitiveArray(Object value) {
        if (value == null || value instanceof String || value instanceof Number || value instanceof Boolean) return true;
        if (value instanceof List<?> list) return list.stream().allMatch(this::isPrimitive);
        return false;
    }

    private boolean isPrimitive(Object value) {
        return value == null || value instanceof String || value instanceof Number || value instanceof Boolean;
    }

    private String normalizeRequired(String value, String field) {
        if (!StringUtils.hasText(value)) throw new ResourceBadRequestException(field + " không được để trống");
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private record StudentProfileContext(User user, Student student) { }
}
