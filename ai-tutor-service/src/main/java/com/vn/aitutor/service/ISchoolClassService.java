package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.ClassAssignmentRequest;
import com.vn.aitutor.dto.response.analytics.ClassAssignmentResponse;
import com.vn.aitutor.entity.SchoolClass;
import java.util.UUID;

public interface ISchoolClassService {

    SchoolClass findOrCreate(String schoolName, String gradeLevel, String className);

    ClassAssignmentResponse assignTeacher(UUID classId, ClassAssignmentRequest request);
}
