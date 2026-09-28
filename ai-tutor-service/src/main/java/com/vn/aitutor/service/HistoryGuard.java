package com.vn.aitutor.service;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.security.principal.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class HistoryGuard {

    public void reject(UserPrincipal principal, String method, String path) {
        String userId = "unknown";
        String role = "unknown";
        if (principal != null && principal.getUsers() != null) {
            User user = principal.getUsers();
            if (user.getId() != null) {
                userId = user.getId().toString();
            }
            if (user.getRole() != null) {
                role = user.getRole().name();
            }
        }
        log.warn("History mutation blocked user={} role={} method={} path={}", userId, role, method, path);
        throw new ResourceForbiddenException("Không được sửa hoặc xóa dữ liệu lịch sử");
    }
}
