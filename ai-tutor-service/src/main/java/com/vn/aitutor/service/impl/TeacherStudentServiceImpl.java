package com.vn.aitutor.service.impl;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.StudentAdminListItemResponse;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.service.IAdminStudentService;
import com.vn.aitutor.service.ITeacherStudentService;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherStudentServiceImpl implements ITeacherStudentService {
    private final TeacherRepository teacherRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;
    private final IAdminStudentService adminStudentService;

    @Override
    public PageResponseDTO<StudentAdminListItemResponse> searchStudents(UUID teacherUserId, String search, PageRequest pageRequest) {
        UUID teacherId = teacherRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ giáo viên")).getId();
        Set<UUID> classIds = assignmentRepository.findByTeacherIdWithClass(teacherId).stream()
                .map(a -> a.getSchoolClass().getId()).collect(Collectors.toSet());
        if (classIds.isEmpty()) {
            return PageResponseDTO.<StudentAdminListItemResponse>builder().content(List.of())
                    .page(pageRequest.getPageNumber() + 1).size(pageRequest.getPageSize())
                    .totalElements(0L).totalPages(0).hasNext(false).hasPrevious(false).build();
        }
        Page<Student> page = studentRepository.searchTeacherStudents(classIds, blankToNull(search), bounded(pageRequest));
        List<StudentAdminListItemResponse> items = page.getContent().stream().map(this::toListItem).toList();
        return PageResponseDTO.<StudentAdminListItemResponse>builder().content(items).page(page.getNumber() + 1)
                .size(page.getSize()).totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .hasNext(page.hasNext()).hasPrevious(page.hasPrevious()).build();
    }

    @Override
    public ApiResponse<StudentAdminDetailResponse> getStudentDetail(UUID teacherUserId, UUID studentId) {
        UUID teacherId = teacherRepository.findByUserId(teacherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ giáo viên")).getId();
        Student student = studentRepository.findActiveStudentWithUserById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        boolean allowed = assignmentRepository.findByTeacherIdWithClass(teacherId).stream()
                .anyMatch(a -> student.getClassEntity() != null && a.getSchoolClass().getId().equals(student.getClassEntity().getId()));
        if (!allowed) throw new ResourceForbiddenException("Học sinh không thuộc lớp giáo viên được phân công");
        return adminStudentService.getStudentDetail(studentId);
    }

    private PageRequest bounded(PageRequest request) {
        Sort.Order order = request.getSort().stream().findFirst().orElse(Sort.Order.desc("createdAt"));
        String property = switch (order.getProperty()) {
            case "fullName" -> "u.full_name";
            case "createdAt" -> "u.created_at";
            case "totalXp" -> "s.total_xp";
            case "lastActivityDate" -> "s.last_activity_date";
            default -> "u.created_at";
        };
        return PageRequest.of(Math.max(0, request.getPageNumber()), Math.min(Math.max(1, request.getPageSize()), 50),
                Sort.by(order.getDirection(), property));
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
                .currentStreak(student.getCurrentStreak()).lastActivityDate(student.getLastActivityDate())
                .active(user.isActive()).createdAt(user.getCreatedAt()).updatedAt(user.getUpdatedAt()).build();
    }

    private String blankToNull(String value) { return StringUtils.hasText(value) ? value.trim() : null; }
}
