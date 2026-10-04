package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

class StudentManagementSecurityContractTest {
    @Test
    void adminControllerIsRestrictedToAdmins() {
        assertEquals("hasAuthority('ROLE_ADMIN')",
                AdminStudentController.class.getAnnotation(PreAuthorize.class).value());
    }

    @Test
    void teacherControllerIsRestrictedToTeachers() {
        assertEquals("hasAuthority('ROLE_TEACHER')",
                TeacherStudentController.class.getAnnotation(PreAuthorize.class).value());
    }
}
