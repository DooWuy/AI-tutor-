package com.vn.aitutor.service.analytics;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.StudyClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudyClassEnrollmentRepository;
import com.vn.aitutor.repository.StudyClassRepository;
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
    private final StudyClassRepository studyClassRepository;
    private final StudyClassEnrollmentRepository enrollmentRepository;

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

    public boolean isStudyClass(UUID classId) {
        return !schoolClassRepository.existsById(classId) && studyClassRepository.existsById(classId);
    }

    public int countApprovedMembers(UUID classId) {
        return (int) enrollmentRepository.countApprovedActive(classId);
    }

    public ReadableClass requireScope(UserPrincipal principal, UUID classId) {
        if (schoolClassRepository.existsById(classId)) {
            return ReadableClass.of(requireReadableClass(principal, classId));
        }
        StudyClass studyClass = studyClassRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        assertCanReadStudy(principal, studyClass);
        return ReadableClass.study(studyClass);
    }

    private void assertCanReadStudy(UserPrincipal principal, StudyClass studyClass) {
        if (principal == null || principal.getUsers() == null) {
            throw new ResourceForbiddenException("Không xác định được người dùng");
        }
        User user = principal.getUsers();
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (user.getRole() != Role.TEACHER) {
            throw new ResourceForbiddenException("Học sinh không được xem phân tích lớp");
        }
        Teacher teacher = teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceForbiddenException("Tài khoản không gắn với hồ sơ giáo viên"));
        if (studyClass.getTeacher() == null || !teacher.getId().equals(studyClass.getTeacher().getId())) {
            throw new ResourceForbiddenException("Giáo viên không quản lý lớp học thêm này");
        }
    }
}
