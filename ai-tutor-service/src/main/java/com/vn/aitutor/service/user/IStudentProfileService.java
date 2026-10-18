package com.vn.aitutor.service.user;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.user.StudentProfileResponse;
import com.vn.aitutor.dto.request.user.StudentProfileUpdateRequest;
import java.io.IOException;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

public interface IStudentProfileService {
    ApiResponse<StudentProfileResponse> getMyProfile(UUID userId);
    ApiResponse<StudentProfileResponse> updateMyProfile(UUID userId, StudentProfileUpdateRequest request);
    ApiResponse<StudentProfileResponse> uploadMyAvatar(UUID userId, MultipartFile file) throws IOException;
}
