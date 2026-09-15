package com.vn.aitutor.service;

import com.vn.aitutor.dto.request.LoginRequest;
import com.vn.aitutor.dto.request.RegisterRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface IAuthService {
    ApiResponse<AuthResponse> login(LoginRequest request, HttpServletResponse response);
    ApiResponse<AuthResponse> register(RegisterRequest request, HttpServletResponse response);
    ApiResponse<String> logout(HttpServletRequest request, HttpServletResponse response);
    ApiResponse<AuthResponse> refreshToken(HttpServletRequest request, HttpServletResponse response);
}
