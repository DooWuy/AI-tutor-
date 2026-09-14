package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.LoginRequest;
import com.vn.aitutor.dto.request.RegisterRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface IAuthService {
    ApiResponse<AuthResponse> login(LoginRequest request);
    ApiResponse<AuthResponse> register(RegisterRequest request);
    ApiResponse<String> logout(HttpServletRequest request);
}
