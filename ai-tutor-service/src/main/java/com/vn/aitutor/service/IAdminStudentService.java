package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.StudentAdminCreateRequest;
import com.vn.aitutor.dto.request.StudentAdminUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.PageResponseDTO;
import com.vn.aitutor.dto.response.StudentAdminDetailResponse;
import com.vn.aitutor.dto.response.StudentAdminListItemResponse;
import com.vn.aitutor.dto.response.StudentStatusUpdateResponse;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;

public interface IAdminStudentService {
    PageResponseDTO<StudentAdminListItemResponse> searchStudents(
            String search, Boolean active, String gradeLevel, String schoolName,
            UUID classId, PageRequest pageRequest);

    ApiResponse<StudentAdminDetailResponse> getStudentDetail(UUID studentId);
    ApiResponse<StudentAdminDetailResponse> createStudent(StudentAdminCreateRequest request);
    ApiResponse<StudentAdminDetailResponse> updateStudent(UUID studentId, StudentAdminUpdateRequest request);
    ApiResponse<StudentStatusUpdateResponse> toggleStudentStatus(UUID studentId);
    ApiResponse<String> softDeleteStudent(UUID studentId);
}
