package com.vn.aitutor.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn.aitutor.service.system.ISystemSettingsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
public class MaintenanceFilter extends OncePerRequestFilter {

    private final ISystemSettingsService systemSettingsService;
    private final ObjectMapper objectMapper;

    public MaintenanceFilter(ISystemSettingsService systemSettingsService) {
        this.systemSettingsService = systemSettingsService;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        boolean maintenanceActive = systemSettingsService.getBoolean("system.maintenance_mode", false);
        if (!maintenanceActive) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        // Allow admin endpoints, auth endpoints, swagger docs, error, and websocket
        if (isWhitelisted(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Allow users who already have ROLE_ADMIN
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            filterChain.doFilter(request, response);
            return;
        }

        // Block student and public traffic with HTTP 503
        String message = systemSettingsService.getSetting(
                "system.maintenance_message",
                "Hệ thống đang được nâng cấp bảo trì định kỳ để mang lại trải nghiệm tốt hơn. Vui lòng quay lại sau ít phút! Cảm ơn bạn."
        );

        response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorBody = Map.of(
                "success", false,
                "status", 503,
                "error", "MAINTENANCE_MODE",
                "message", message
        );

        response.getWriter().write(objectMapper.writeValueAsString(errorBody));
    }

    private boolean isWhitelisted(String path) {
        return path.startsWith("/api/v1/admin/")
                || path.startsWith("/api/v1/auth/")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs/")
                || path.equals("/error")
                || path.startsWith("/ws/");
    }
}
