package com.vn.aitutor.service;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.StudentAdminListItemResponse;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;

public interface ITeacherStudentService {
    PageResponseDTO<StudentAdminListItemResponse> searchStudents(UUID teacherUserId, String search, PageRequest pageRequest);
    ApiResponse<StudentAdminDetailResponse> getStudentDetail(UUID teacherUserId, UUID studentId);
}
