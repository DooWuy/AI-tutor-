package com.vn.aitutor.service;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AnalyticsAccess {

    private final SchoolClassRepository schoolClassRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;

    public SchoolClass requireReadableClass(UserPrincipal principal, UUID classId) {
        SchoolClass schoolClass = schoolClassRepository
                .findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        assertCanRead(principal, classId);
        return schoolClass;
    }

    private void assertCanRead(UserPrincipal principal, UUID classId) {
        if (principal == null || principal.getUsers() == null) {
            throw new ResourceForbiddenException("Không xác định được người dùng");
        }
        User user = principal.getUsers();
        Role role = user.getRole();
        if (role == Role.ADMIN) {
            return;
        }
        if (role != Role.TEACHER) {
            throw new ResourceForbiddenException("Học sinh không được xem phân tích lớp");
        }
        Teacher teacher = teacherRepository
                .findByUserId(user.getId())
                .orElseThrow(() -> new ResourceForbiddenException("Tài khoản không gắn với hồ sơ giáo viên"));
        if (!assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(teacher.getId(), classId)) {
            throw new ResourceForbiddenException("Giáo viên không được phân quyền xem lớp học này");
        }
    }
}
