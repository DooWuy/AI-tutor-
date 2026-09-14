package com.vn.aitutor.exception;

import com.vn.aitutor.dto.response.JwtErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {


    public static final String EXPIRED = "ExpiredJwtException";
    public static final String MALFORMED = "MalformedJwtException";
    public static final String SIGNATURE = "SignatureException";
    public static final String UNSUPPORTED = "UnsupportedJwtException";
    public static final String ILLEGAL = "IllegalArgumentException";

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        String error = (String) request.getAttribute("error");

        if (error == null) {
            error = authException.getClass().getSimpleName();
        }

        JwtErrorResponse errorResponse = buildErrorResponse(error);
        response.getWriter().write(new ObjectMapper().writeValueAsString(errorResponse));
        response.getWriter().flush();
        response.getWriter().close();
    }

    private JwtErrorResponse buildErrorResponse(String error) {
        return switch (error) {
            case EXPIRED -> new JwtErrorResponse("Không có quyền truy cập", "Token đã hết hạn");
            case MALFORMED -> new JwtErrorResponse("Không có quyền truy cập", "Token không đúng định dạng");
            case SIGNATURE -> new JwtErrorResponse("Không có quyền truy cập", "Chữ ký token không hợp lệ");
            case UNSUPPORTED -> new JwtErrorResponse("Không có quyền truy cập", "Loại token không được hỗ trợ");
            case ILLEGAL -> new JwtErrorResponse("Không có quyền truy cập", "Token không hợp lệ");
            default -> new JwtErrorResponse("Không có quyền truy cập", "Có lỗi xảy ra");
        };
    }
}