package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class HistoryGuardTest {

    private final HistoryGuard historyGuard = new HistoryGuard();

    @Test
    void ac07_teacherAndAdminCannotMutateHistory() {
        ResourceForbiddenException teacher = assertThrows(
                ResourceForbiddenException.class,
                () -> historyGuard.reject(principal(Role.TEACHER), "DELETE", "/api/v1/parent-messages/" + UUID.randomUUID()));
        ResourceForbiddenException admin = assertThrows(
                ResourceForbiddenException.class,
                () -> historyGuard.reject(principal(Role.ADMIN), "PUT", "/api/v1/quiz-attempts/" + UUID.randomUUID()));

        assertEquals("Không được sửa hoặc xóa dữ liệu lịch sử", teacher.getMessage());
        assertEquals("Không được sửa hoặc xóa dữ liệu lịch sử", admin.getMessage());
    }

    private static UserPrincipal principal(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        return UserPrincipal.builder().users(user).build();
    }
}
