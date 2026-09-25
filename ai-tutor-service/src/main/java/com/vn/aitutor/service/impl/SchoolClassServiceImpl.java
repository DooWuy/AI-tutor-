package com.vn.aitutor.service.impl;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.dto.request.ClassAssignmentRequest;
import com.vn.aitutor.dto.response.analytics.ClassAssignmentResponse;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.TeacherClassAssignment;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.service.ISchoolClassService;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class SchoolClassServiceImpl implements ISchoolClassService {

    private final SchoolClassRepository schoolClassRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final TeacherRepository teacherRepository;
    private final AcademicCalendar academicCalendar;

    @Override
    @Transactional
    public SchoolClass findOrCreate(String schoolName, String gradeLevel, String className) {
        if (!StringUtils.hasText(className)) {
            throw new ResourceBadRequestException("Tên lớp không được để trống");
        }
        String trimmedName = className.trim();
        String year = academicCalendar.currentAcademicYear(Instant.now());
        return schoolClassRepository
                .findBySchoolYearAndName(blankToNull(schoolName), year, trimmedName)
                .orElseGet(() -> {
                    SchoolClass created = new SchoolClass();
                    created.setName(trimmedName);
                    created.setGradeLevel(StringUtils.hasText(gradeLevel) ? gradeLevel.trim() : "");
                    created.setSchoolName(blankToNull(schoolName));
                    created.setAcademicYear(year);
                    return schoolClassRepository.save(created);
                });
    }

    @Override
    @Transactional
    public ClassAssignmentResponse assignTeacher(UUID classId, ClassAssignmentRequest request) {
        SchoolClass schoolClass = schoolClassRepository
                .findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        Teacher teacher = teacherRepository
                .findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));

        String subject = normalizeSubject(request.getSubject());

        if (request.isHomeroom()) {
            assignmentRepository.clearHomeroomForClass(classId);
            assignmentRepository.flush();
            schoolClass.setHomeroomTeacher(teacher);
            schoolClassRepository.save(schoolClass);
        }

        TeacherClassAssignment assignment = assignmentRepository
                .findByTeacherClassAndSubject(teacher.getId(), classId, subject)
                .orElseGet(() -> {
                    TeacherClassAssignment created = new TeacherClassAssignment();
                    created.setTeacher(teacher);
                    created.setSchoolClass(schoolClass);
                    created.setSubject(subject);
                    return created;
                });
        assignment.setHomeroom(request.isHomeroom() || assignment.isHomeroom());
        TeacherClassAssignment saved = assignmentRepository.save(assignment);

        return ClassAssignmentResponse.builder()
                .id(saved.getId())
                .classId(schoolClass.getId())
                .teacherId(teacher.getId())
                .subject(saved.getSubject())
                .homeroom(saved.isHomeroom())
                .build();
    }

    private String normalizeSubject(String raw) {
        if (!StringUtils.hasText(raw) || SubjectCode.isAll(raw)) {
            return null;
        }
        return SubjectCode.parseRequired(raw).name();
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
