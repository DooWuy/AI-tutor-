package com.vn.aitutor.service.user;

import com.vn.aitutor.dto.request.user.StudentAdminCreateRequest;
import com.vn.aitutor.dto.request.user.StudentAdminUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.user.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.user.StudentAdminListItemResponse;
import com.vn.aitutor.dto.response.user.StudentImportResponse;
import com.vn.aitutor.dto.response.user.StudentImportResponse.StudentImportError;
import com.vn.aitutor.dto.response.user.StudentStatusUpdateResponse;
import com.vn.aitutor.security.principal.UserPrincipalCache;
import com.vn.aitutor.service.gamification.StreakService;
import com.vn.aitutor.service.workbook.StudentWorkbook;
import com.vn.aitutor.service.workbook.StudentWorkbook.StudentExcelRow;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import com.vn.aitutor.entity.PasswordResetToken;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.PasswordResetTokenRepository;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.ScheduleRepository;
import com.vn.aitutor.repository.projection.StudentLearningSummaryRow;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.user.IAdminStudentService;
import com.vn.aitutor.service.system.IMailService;
import com.vn.aitutor.service.classroom.ISchoolClassService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminStudentServiceImpl implements IAdminStudentService {
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final IMailService mailService;
    private final ISchoolClassService schoolClassService;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ScheduleRepository scheduleRepository;
    private final StreakService streaks;
    private final UserPrincipalCache userPrincipalCache;

    @Override
    @Transactional(readOnly = true)
    public PageResponseDTO<StudentAdminListItemResponse> searchStudents(
            String search, Boolean active, String gradeLevel, String schoolName,
            UUID classId, PageRequest pageRequest) {
        PageRequest bounded = PageRequest.of(
                Math.max(0, pageRequest.getPageNumber()),
                Math.min(Math.max(1, pageRequest.getPageSize()), 50),
                allowedSort(pageRequest.getSort()));
        Page<Student> page = studentRepository.searchAdminStudents(
                blankToNull(search), active, blankToNull(gradeLevel), blankToNull(schoolName), classId, bounded);
        List<StudentAdminListItemResponse> content = page.getContent().stream()
                .map(this::toListItem)
                .collect(Collectors.toList());
        return PageResponseDTO.<StudentAdminListItemResponse>builder()
                .content(content).page(page.getNumber() + 1).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .hasNext(page.hasNext()).hasPrevious(page.hasPrevious()).build();
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<StudentAdminDetailResponse> getStudentDetail(UUID studentId) {
        return success("Lấy thông tin học sinh thành công", toDetail(findStudent(studentId)));
    }

    @Override
    public ApiResponse<StudentAdminDetailResponse> createStudent(StudentAdminCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceConflictException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceConflictException("Email đã được sử dụng");
        }
        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setPhoneNumber(blankToNull(request.getPhoneNumber()));
        user.setGender(request.getGender() == null ? Gender.OTHER : request.getGender());
        user.setRole(Role.STUDENT);
        user.setActive(true);
        User savedUser = userRepository.save(user);

        Student student = new Student();
        student.setUser(savedUser);
        student.setStudentCode(generateStudentCode());
        student.setSchoolName(request.getSchoolName().trim());
        student.setGradeLevel(request.getGradeLevel().trim());
        student.setClassName(blankToNull(request.getClassName()));
        student.setEmail(savedUser.getEmail());
        student.setClassEntity(resolveClass(student.getSchoolName(), student.getGradeLevel(), student.getClassName()));
        Student savedStudent = studentRepository.save(student);

        String token = UUID.randomUUID().toString();
        passwordResetTokenRepository.save(PasswordResetToken.builder().token(token).user(savedUser)
                .expiryDate(LocalDateTime.now().plusHours(24)).isUsed(false).build());
        mailService.sendAccountSetupEmail(savedUser.getEmail(), savedUser.getFullName(), savedUser.getUsername(), token);
        return success("Tạo học sinh thành công", toDetail(savedStudent));
    }

    @Override
    public ApiResponse<StudentAdminDetailResponse> updateStudent(UUID studentId, StudentAdminUpdateRequest request) {
        Student student = findStudent(studentId);
        User user = student.getUser();
        user.setFullName(request.getFullName().trim());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(blankToNull(request.getPhoneNumber()));
        if (request.getSchoolName() != null) student.setSchoolName(blankToNull(request.getSchoolName()));
        if (request.getGradeLevel() != null) student.setGradeLevel(blankToNull(request.getGradeLevel()));
        if (request.getClassName() != null) {
            student.setClassName(blankToNull(request.getClassName()));
            student.setClassEntity(resolveClass(student.getSchoolName(), student.getGradeLevel(), student.getClassName()));
        }
        student.setAddress(request.getAddress());
        student.setParentName(request.getParentName());
        student.setParentEmail(request.getParentEmail());
        student.setParentPhone(request.getParentPhone());
        if (request.getStudyPreferences() != null) student.setStudyPreferences(request.getStudyPreferences());
        userRepository.save(user);
        userPrincipalCache.evict(user.getUsername());
        userPrincipalCache.evict(user.getEmail());
        return success("Cập nhật học sinh thành công", toDetail(studentRepository.save(student)));
    }

    @Override
    public ApiResponse<StudentStatusUpdateResponse> toggleStudentStatus(UUID studentId) {
        Student student = findStudent(studentId);
        User user = student.getUser();
        user.setActive(!user.isActive());
        userRepository.save(user);
        userPrincipalCache.evict(user.getUsername());
        userPrincipalCache.evict(user.getEmail());
        return success("Cập nhật trạng thái thành công", StudentStatusUpdateResponse.builder()
                .studentId(student.getId()).userId(user.getId()).active(user.isActive()).build());
    }

    @Override
    public ApiResponse<String> softDeleteStudent(UUID studentId) {
        Student student = findStudent(studentId);
        User user = student.getUser();
        user.setDeleted(true);
        userRepository.save(user);
        userPrincipalCache.evict(user.getUsername());
        userPrincipalCache.evict(user.getEmail());
        return success("Xóa mềm học sinh thành công", null);
    }

    @Override
    public ApiResponse<StudentImportResponse> importStudentsFromExcel(byte[] content) {
        List<StudentExcelRow> rows = StudentWorkbook.read(content);
        List<StudentImportError> errors = new ArrayList<>();
        List<StudentAdminListItemResponse> createdStudents = new ArrayList<>();
        Set<String> batchUsernames = new HashSet<>();
        Set<String> batchEmails = new HashSet<>();

        for (StudentExcelRow row : rows) {
            int line = row.getRowNumber();

            // Validate missing required fields
            if (!StringUtils.hasText(row.getUsername())) {
                errors.add(StudentImportError.builder().rowNumber(line).username(row.getUsername()).email(row.getEmail())
                        .errorMessage("Tên đăng nhập không được để trống").build());
                continue;
            }
            if (!StringUtils.hasText(row.getEmail())) {
                errors.add(StudentImportError.builder().rowNumber(line).username(row.getUsername()).email(row.getEmail())
                        .errorMessage("Email không được để trống").build());
                continue;
            }
            if (!StringUtils.hasText(row.getFullName())) {
                errors.add(StudentImportError.builder().rowNumber(line).username(row.getUsername()).email(row.getEmail())
                        .errorMessage("Họ và tên không được để trống").build());
                continue;
            }
            if (!StringUtils.hasText(row.getSchoolName())) {
                errors.add(StudentImportError.builder().rowNumber(line).username(row.getUsername()).email(row.getEmail())
                        .errorMessage("Trường học không được để trống").build());
                continue;
            }
            if (!StringUtils.hasText(row.getGradeLevel())) {
                errors.add(StudentImportError.builder().rowNumber(line).username(row.getUsername()).email(row.getEmail())
                        .errorMessage("Khối lớp không được để trống").build());
                continue;
            }

            String uname = row.getUsername().trim();
            String mail = row.getEmail().trim().toLowerCase();

            // Check duplicate in current batch
            if (!batchUsernames.add(uname)) {
                errors.add(StudentImportError.builder().rowNumber(line).username(uname).email(mail)
                        .errorMessage("Tên đăng nhập bị trùng lặp trong file").build());
                continue;
            }
            if (!batchEmails.add(mail)) {
                errors.add(StudentImportError.builder().rowNumber(line).username(uname).email(mail)
                        .errorMessage("Email bị trùng lặp trong file").build());
                continue;
            }

            // Check duplicate in DB
            if (userRepository.existsByUsername(uname)) {
                errors.add(StudentImportError.builder().rowNumber(line).username(uname).email(mail)
                        .errorMessage("Tên đăng nhập đã tồn tại trong hệ thống").build());
                continue;
            }
            if (userRepository.existsByEmail(mail)) {
                errors.add(StudentImportError.builder().rowNumber(line).username(uname).email(mail)
                        .errorMessage("Email đã được sử dụng trong hệ thống").build());
                continue;
            }

            try {
                User user = new User();
                user.setUsername(uname);
                user.setEmail(mail);
                user.setPasswordHash(passwordEncoder.encode(row.getPassword()));
                user.setFullName(row.getFullName().trim());
                user.setDateOfBirth(row.getDateOfBirth());
                user.setPhoneNumber(blankToNull(row.getPhoneNumber()));
                user.setGender(row.getGender() == null ? Gender.OTHER : row.getGender());
                user.setRole(Role.STUDENT);
                user.setActive(true);
                User savedUser = userRepository.save(user);

                Student student = new Student();
                student.setUser(savedUser);
                student.setStudentCode(generateStudentCode());
                student.setSchoolName(row.getSchoolName().trim());
                student.setGradeLevel(row.getGradeLevel().trim());
                student.setClassName(blankToNull(row.getClassName()));
                student.setEmail(savedUser.getEmail());
                student.setAddress(blankToNull(row.getAddress()));
                student.setParentName(blankToNull(row.getParentName()));
                student.setParentPhone(blankToNull(row.getParentPhone()));
                student.setParentEmail(blankToNull(row.getParentEmail()));
                student.setClassEntity(resolveClass(student.getSchoolName(), student.getGradeLevel(), student.getClassName()));
                Student savedStudent = studentRepository.save(student);

                createdStudents.add(toListItem(savedStudent));
            } catch (Exception ex) {
                errors.add(StudentImportError.builder().rowNumber(line).username(uname).email(mail)
                        .errorMessage("Lỗi tạo tài khoản: " + ex.getMessage()).build());
            }
        }

        StudentImportResponse response = StudentImportResponse.builder()
                .totalRows(rows.size())
                .successCount(createdStudents.size())
                .errorCount(errors.size())
                .errors(errors)
                .createdStudents(createdStudents)
                .build();

        String message = String.format("Nhập dữ liệu hoàn tất: Thành công %d/%d học sinh (Lỗi %d)",
                createdStudents.size(), rows.size(), errors.size());
        return success(message, response);
    }

    private Student findStudent(UUID id) {
        return studentRepository.findActiveStudentWithUserById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh với id: " + id));
    }

    private SchoolClass resolveClass(String school, String grade, String name) {
        return StringUtils.hasText(name) ? schoolClassService.findOrCreate(school, grade, name) : null;
    }

    private String generateStudentCode() {
        String code;
        do { code = "STU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }
        while (studentRepository.existsByStudentCode(code));
        return code;
    }

    private StudentAdminListItemResponse toListItem(Student student) {
        User user = student.getUser();
        return StudentAdminListItemResponse.builder().studentId(student.getId()).userId(user.getId())
                .studentCode(student.getStudentCode()).username(user.getUsername()).email(user.getEmail())
                .fullName(user.getFullName()).phoneNumber(user.getPhoneNumber()).avatarUrl(user.getAvatarUrl())
                .gender(user.getGender() == null ? null : user.getGender().name()).dateOfBirth(user.getDateOfBirth())
                .schoolName(student.getSchoolName()).gradeLevel(student.getGradeLevel())
                .classId(student.getClassEntity() == null ? null : student.getClassEntity().getId())
                .className(student.getClassName()).totalXp(student.getTotalXp()).currentLevel(student.getCurrentLevel())
                .currentStreak(streaks.effectiveCurrentStreak(student)).lastActivityDate(student.getLastActivityDate())
                .active(user.isActive()).createdAt(user.getCreatedAt()).updatedAt(user.getUpdatedAt()).build();
    }

    private StudentAdminDetailResponse toDetail(Student student) {
        StudentAdminListItemResponse item = toListItem(student);
        StudentLearningSummaryRow summary = quizAttemptRepository.summarizeForStudent(student.getId());
        return StudentAdminDetailResponse.builder().studentId(item.getStudentId()).userId(item.getUserId())
                .studentCode(item.getStudentCode()).username(item.getUsername()).email(item.getEmail())
                .fullName(item.getFullName()).phoneNumber(item.getPhoneNumber()).avatarUrl(item.getAvatarUrl())
                .gender(item.getGender()).dateOfBirth(item.getDateOfBirth()).schoolName(item.getSchoolName())
                .gradeLevel(item.getGradeLevel()).classId(item.getClassId()).className(item.getClassName())
                .totalXp(item.getTotalXp()).currentLevel(item.getCurrentLevel()).currentStreak(item.getCurrentStreak())
                .lastActivityDate(item.getLastActivityDate()).active(item.isActive()).createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt()).longestStreak(student.getLongestStreak())
                .address(student.getAddress()).studyPreferences(student.getStudyPreferences())
                .parentName(student.getParentName()).parentEmail(student.getParentEmail()).parentPhone(student.getParentPhone())
                .quizAttemptCount(summary == null || summary.getQuizAttemptCount() == null ? 0 : summary.getQuizAttemptCount())
                .averageScore(summary == null ? null : summary.getAverageScore())
                .lastQuizSubmittedAt(summary == null ? null : summary.getLastQuizSubmittedAt())
                .chatSessionCount(chatSessionRepository.countByStudent_Id(student.getId()))
                .scheduleCount(scheduleRepository.countByStudent_Id(student.getId())).build();
    }

    private Sort allowedSort(Sort requested) {
        Sort.Order order = requested.stream().findFirst().orElse(Sort.Order.desc("user.createdAt"));
        String property = switch (order.getProperty()) {
            case "fullName" -> "u.full_name";
            case "totalXp" -> "s.total_xp";
            case "lastActivityDate" -> "s.last_activity_date";
            case "createdAt" -> "u.created_at";
            default -> "u.created_at";
        };
        return Sort.by(order.getDirection(), property);
    }

    private String blankToNull(String value) { return StringUtils.hasText(value) ? value.trim() : null; }

    private <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }
}
