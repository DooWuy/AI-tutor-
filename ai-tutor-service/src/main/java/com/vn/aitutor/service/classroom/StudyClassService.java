package com.vn.aitutor.service.classroom;

import com.vn.aitutor.dto.request.EnrollmentActionRequest;
import com.vn.aitutor.dto.request.StudyClassCreateRequest;
import com.vn.aitutor.dto.request.StudyClassJoinRequest;
import com.vn.aitutor.dto.request.StudyClassUpdateRequest;
import com.vn.aitutor.dto.response.StudyClassJoinResponse;
import com.vn.aitutor.dto.response.StudyClassListResponse;
import com.vn.aitutor.dto.response.StudyClassResponse;
import com.vn.aitutor.dto.response.StudyMemberResponse;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.StudyClass;
import com.vn.aitutor.entity.StudyClassEnrollment;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.EnrollmentStatus;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.StudyClassStatus;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.StudyClassEnrollmentRepository;
import com.vn.aitutor.repository.StudyClassRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class StudyClassService {

    static final int ACTIVE_LIMIT = 4;
    static final int DEFAULT_MAX_STUDENTS = 40;
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StudyClassRepository studyClassRepository;
    private final StudyClassEnrollmentRepository enrollmentRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final Clock learningClock;

    @Transactional
    public int dissolveExpired() {
        return studyClassRepository.dissolveExpired(today(), learningClock.instant());
    }

    @Transactional
    public StudyClassListResponse list(UserPrincipal principal, String status, String keyword) {
        Teacher teacher = requireTeacher(principal);
        dissolveExpired();
        StudyClassStatus filter = parseClassStatus(status);
        String needle = StringUtils.hasText(keyword) ? keyword.trim().toLowerCase(Locale.ROOT) : null;
        List<StudyClassResponse> classes = studyClassRepository.findByTeacher_IdOrderByCreatedAtDesc(teacher.getId()).stream()
                .filter(item -> filter == null || item.getStatus() == filter)
                .filter(item -> needle == null
                        || item.getName().toLowerCase(Locale.ROOT).contains(needle)
                        || item.getClassCode().toLowerCase(Locale.ROOT).contains(needle))
                .map(item -> toResponse(item, false))
                .toList();
        int activeCount = (int) studyClassRepository.countByTeacher_IdAndStatus(teacher.getId(), StudyClassStatus.ACTIVE);
        return StudyClassListResponse.builder().activeCount(activeCount).classes(classes).build();
    }

    @Transactional
    public StudyClassResponse create(UserPrincipal principal, StudyClassCreateRequest request) {
        Teacher teacher = requireTeacher(principal);
        dissolveExpired();
        if (studyClassRepository.countByTeacher_IdAndStatus(teacher.getId(), StudyClassStatus.ACTIVE) >= ACTIVE_LIMIT) {
            throw new ResourceBadRequestException("Bạn đã có 4 lớp đang hoạt động");
        }
        LocalDate start = today();
        StudyClass studyClass = new StudyClass();
        studyClass.setName(request.getName().trim());
        studyClass.setDescription(blankToNull(request.getDescription()));
        studyClass.setTeacher(teacher);
        studyClass.setStatus(StudyClassStatus.ACTIVE);
        studyClass.setMaxStudents(request.getMaxStudents() == null ? DEFAULT_MAX_STUDENTS : request.getMaxStudents());
        studyClass.setStartDate(start);
        studyClass.setEndDate(resolveEndDate(start, request.getEndDate(), request.getDurationAmount(), request.getDurationUnit()));
        studyClass.setClassCode(nextClassCode());
        return toResponse(studyClassRepository.save(studyClass), false);
    }

    @Transactional
    public StudyClass owned(UserPrincipal principal, UUID classId) {
        dissolveExpired();
        return requireOwned(requireTeacher(principal), classId);
    }

    @Transactional
    public StudyClassResponse get(UserPrincipal principal, UUID classId) {
        return toResponse(owned(principal, classId), true);
    }

    @Transactional
    public StudyClassResponse update(UserPrincipal principal, UUID classId, StudyClassUpdateRequest request) {
        dissolveExpired();
        StudyClass studyClass = requireOwnedActive(requireTeacher(principal), classId);
        long approved = enrollmentRepository.countByStudyClass_IdAndStatus(classId, EnrollmentStatus.APPROVED);
        if (request.getMaxStudents() < approved) {
            throw new ResourceBadRequestException("Sĩ số tối đa không được nhỏ hơn số học sinh đã duyệt");
        }
        LocalDate endDate = request.getEndDate();
        if (endDate != null && endDate.isBefore(today())) {
            throw new ResourceBadRequestException("Hạn kết thúc phải từ hôm nay trở đi");
        }
        studyClass.setName(request.getName().trim());
        studyClass.setDescription(blankToNull(request.getDescription()));
        studyClass.setMaxStudents(request.getMaxStudents());
        studyClass.setEndDate(endDate);
        return toResponse(studyClassRepository.save(studyClass), true);
    }

    @Transactional
    public StudyClassResponse dissolve(UserPrincipal principal, UUID classId) {
        dissolveExpired();
        StudyClass studyClass = requireOwned(requireTeacher(principal), classId);
        if (studyClass.getStatus() == StudyClassStatus.DISSOLVED) {
            throw new ResourceBadRequestException("Lớp đã được giải tán");
        }
        studyClass.setStatus(StudyClassStatus.DISSOLVED);
        return toResponse(studyClassRepository.save(studyClass), true);
    }

    @Transactional
    public List<StudyMemberResponse> requests(UserPrincipal principal, UUID classId, String status) {
        dissolveExpired();
        StudyClass studyClass = requireOwned(requireTeacher(principal), classId);
        EnrollmentStatus filter = parseEnrollmentStatus(status);
        return enrollmentRepository.findByStudyClass_IdAndStatusOrderByRequestedAtAsc(studyClass.getId(), filter).stream()
                .map(this::toMember)
                .toList();
    }

    @Transactional
    public StudyMemberResponse act(UserPrincipal principal, UUID classId, UUID requestId, EnrollmentActionRequest request) {
        dissolveExpired();
        StudyClass studyClass = requireOwned(requireTeacher(principal), classId);
        StudyClassEnrollment enrollment = enrollmentRepository.findByIdAndStudyClass_Id(requestId, classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu gia nhập"));
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new ResourceBadRequestException("Yêu cầu này đã được xử lý");
        }
        String action = request.getAction().trim().toLowerCase(Locale.ROOT);
        if ("approve".equals(action)) {
            if (studyClass.getStatus() != StudyClassStatus.ACTIVE) {
                throw new ResourceBadRequestException("Lớp đã giải tán, không duyệt thêm học sinh");
            }
            long approved = enrollmentRepository.countByStudyClass_IdAndStatus(classId, EnrollmentStatus.APPROVED);
            if (approved >= studyClass.getMaxStudents()) {
                throw new ResourceBadRequestException("Lớp đã đủ sĩ số");
            }
            enrollment.setStatus(EnrollmentStatus.APPROVED);
        } else if ("reject".equals(action)) {
            enrollment.setStatus(EnrollmentStatus.REJECTED);
        } else {
            throw new ResourceBadRequestException("Hành động chỉ được là approve hoặc reject");
        }
        enrollment.setReviewedAt(learningClock.instant());
        return toMember(enrollmentRepository.save(enrollment));
    }

    @Transactional
    public StudyClassJoinResponse join(UserPrincipal principal, StudyClassJoinRequest request) {
        Student student = requireStudent(principal);
        dissolveExpired();
        String code = request.getClassCode().trim().toUpperCase(Locale.ROOT);
        if (code.length() != 6) {
            throw new ResourceBadRequestException("Mã lớp gồm 6 ký tự");
        }
        StudyClass studyClass = studyClassRepository.findByClassCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp với mã này"));
        if (studyClass.getStatus() != StudyClassStatus.ACTIVE) {
            throw new ResourceBadRequestException("Lớp đã giải tán");
        }
        StudyClassEnrollment existing = enrollmentRepository
                .findByStudyClass_IdAndStudent_Id(studyClass.getId(), student.getId())
                .orElse(null);
        if (existing == null) {
            StudyClassEnrollment enrollment = new StudyClassEnrollment();
            enrollment.setStudyClass(studyClass);
            enrollment.setStudent(student);
            enrollment.setStatus(EnrollmentStatus.PENDING);
            enrollment.setRequestedAt(learningClock.instant());
            enrollmentRepository.save(enrollment);
        } else if (existing.getStatus() == EnrollmentStatus.PENDING) {
            throw new ResourceConflictException("Bạn đã gửi yêu cầu vào lớp này");
        } else if (existing.getStatus() == EnrollmentStatus.APPROVED) {
            throw new ResourceConflictException("Bạn đã là thành viên của lớp này");
        } else {
            existing.setStatus(EnrollmentStatus.PENDING);
            existing.setRequestedAt(learningClock.instant());
            existing.setReviewedAt(null);
            enrollmentRepository.save(existing);
        }
        return StudyClassJoinResponse.builder()
                .className(studyClass.getName())
                .classCode(studyClass.getClassCode())
                .status(EnrollmentStatus.PENDING)
                .build();
    }

    private LocalDate resolveEndDate(LocalDate start, LocalDate endDate, Integer amount, String unit) {
        boolean hasDate = endDate != null;
        boolean hasAmount = amount != null;
        boolean hasUnit = StringUtils.hasText(unit);
        if (hasDate && (hasAmount || hasUnit)) {
            throw new ResourceBadRequestException("Chỉ chọn một cách đặt hạn");
        }
        if (hasAmount != hasUnit) {
            throw new ResourceBadRequestException("Nhập đủ số lượng và đơn vị thời hạn");
        }
        if (hasDate) {
            if (endDate.isBefore(start)) {
                throw new ResourceBadRequestException("Hạn kết thúc phải từ hôm nay trở đi");
            }
            return endDate;
        }
        if (!hasAmount) {
            return null;
        }
        if (amount > 24 && "MONTHS".equalsIgnoreCase(unit.trim())) {
            throw new ResourceBadRequestException("Thời hạn tối đa 24 tháng");
        }
        return switch (unit.trim().toUpperCase(Locale.ROOT)) {
            case "WEEKS" -> start.plusWeeks(amount);
            case "MONTHS" -> start.plusMonths(amount);
            default -> throw new ResourceBadRequestException("Đơn vị thời hạn là WEEKS hoặc MONTHS");
        };
    }

    private String nextClassCode() {
        for (int attempt = 0; attempt < 8; attempt++) {
            StringBuilder code = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                code.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            if (!studyClassRepository.existsByClassCode(code.toString())) {
                return code.toString();
            }
        }
        throw new ResourceConflictException("Không tạo được mã lớp, hãy thử lại");
    }

    private StudyClass requireOwnedActive(Teacher teacher, UUID classId) {
        StudyClass studyClass = requireOwned(teacher, classId);
        if (studyClass.getStatus() != StudyClassStatus.ACTIVE) {
            throw new ResourceBadRequestException("Lớp đã giải tán, không sửa được");
        }
        return studyClass;
    }

    private StudyClass requireOwned(Teacher teacher, UUID classId) {
        StudyClass studyClass = studyClassRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học thêm"));
        if (!studyClass.getTeacher().getId().equals(teacher.getId())) {
            throw new ResourceForbiddenException("Giáo viên không quản lý lớp học thêm này");
        }
        return studyClass;
    }

    private Teacher requireTeacher(UserPrincipal principal) {
        User user = requireUser(principal);
        if (user.getRole() != Role.TEACHER) {
            throw new ResourceForbiddenException("Chỉ giáo viên tạo và quản lý lớp học thêm");
        }
        return teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ giáo viên"));
    }

    private Student requireStudent(UserPrincipal principal) {
        User user = requireUser(principal);
        if (user.getRole() != Role.STUDENT) {
            throw new ResourceForbiddenException("Chỉ học sinh gửi yêu cầu vào lớp");
        }
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ học sinh"));
    }

    private User requireUser(UserPrincipal principal) {
        if (principal == null || principal.getUsers() == null) {
            throw new ResourceForbiddenException("Bạn chưa đăng nhập");
        }
        return principal.getUsers();
    }

    private StudyClassStatus parseClassStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        try {
            return StudyClassStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("Trạng thái lớp không hợp lệ");
        }
    }

    private EnrollmentStatus parseEnrollmentStatus(String raw) {
        if (!StringUtils.hasText(raw)) {
            return EnrollmentStatus.PENDING;
        }
        try {
            return EnrollmentStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResourceBadRequestException("Trạng thái yêu cầu không hợp lệ");
        }
    }

    private StudyClassResponse toResponse(StudyClass studyClass, boolean withMembers) {
        UUID classId = studyClass.getId();
        List<StudyMemberResponse> members = withMembers
                ? enrollmentRepository.findByStudyClass_IdAndStatusOrderByRequestedAtAsc(classId, EnrollmentStatus.APPROVED).stream()
                        .map(this::toMember)
                        .toList()
                : null;
        return StudyClassResponse.builder()
                .id(classId)
                .name(studyClass.getName())
                .description(studyClass.getDescription())
                .classCode(studyClass.getClassCode())
                .status(studyClass.getStatus())
                .maxStudents(studyClass.getMaxStudents())
                .approvedCount((int) enrollmentRepository.countByStudyClass_IdAndStatus(classId, EnrollmentStatus.APPROVED))
                .pendingCount((int) enrollmentRepository.countByStudyClass_IdAndStatus(classId, EnrollmentStatus.PENDING))
                .startDate(studyClass.getStartDate())
                .endDate(studyClass.getEndDate())
                .createdAt(studyClass.getCreatedAt())
                .members(members)
                .build();
    }

    private StudyMemberResponse toMember(StudyClassEnrollment enrollment) {
        Student student = enrollment.getStudent();
        User user = student.getUser();
        return StudyMemberResponse.builder()
                .id(enrollment.getId())
                .studentId(student.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .studentCode(student.getStudentCode())
                .status(enrollment.getStatus())
                .requestedAt(enrollment.getRequestedAt())
                .build();
    }

    private LocalDate today() {
        return LocalDate.now(learningClock.withZone(ZONE));
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
