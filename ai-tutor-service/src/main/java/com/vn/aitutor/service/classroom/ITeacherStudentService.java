package com.vn.aitutor.service.classroom;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.user.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.user.StudentAdminListItemResponse;
import com.vn.aitutor.entity.Student;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;

public interface ITeacherStudentService {
    PageResponseDTO<StudentAdminListItemResponse> searchStudents(UUID actorUserId, UUID classId, String search, PageRequest pageRequest);
    ApiResponse<StudentAdminDetailResponse> getStudentDetail(UUID teacherUserId, UUID studentId);
    StudentAdminListItemResponse toRosterItem(Student student);
}
