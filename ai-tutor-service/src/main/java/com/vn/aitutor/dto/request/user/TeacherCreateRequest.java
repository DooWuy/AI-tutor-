package com.vn.aitutor.dto.request.user;

import jakarta.validation.constraints.*;

public record TeacherCreateRequest(
    @NotBlank @Size(max=255) @Pattern(regexp="[a-zA-Z0-9_]+") String username,
    @NotBlank @Email @Size(max=255) String email,
    @NotBlank @Size(max=255) String fullName,
    @NotBlank @Size(max=128) String department,
    @NotBlank @Size(max=128) String subjectTaught,
    @Size(max=255) String schoolName) {
    @com.fasterxml.jackson.annotation.JsonAnySetter
    public void rejectUnknown(String field, Object value) {
        throw new IllegalArgumentException("Trường không được phép: " + field);
    }
    public UserCreateRequest toUserRequest() {
        var r = new UserCreateRequest();
        r.setUsername(username); r.setEmail(email); r.setFullName(fullName);
        r.setDepartment(department); r.setSubjectTaught(subjectTaught); r.setSchoolName(schoolName);
        r.setRole(com.vn.aitutor.entity.enums.Role.TEACHER);
        return r;
    }
}
