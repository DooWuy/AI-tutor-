package com.vn.aitutor.service.user;

import com.vn.aitutor.dto.request.user.LoginRequest;
import com.vn.aitutor.dto.request.user.RegisterRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.user.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.vn.aitutor.dto.request.user.SetupPasswordRequest;

public interface IAuthService {
    ApiResponse<AuthResponse> login(LoginRequest request, HttpServletResponse response);
    ApiResponse<AuthResponse> register(RegisterRequest request, HttpServletResponse response);
    ApiResponse<String> logout(HttpServletRequest request, HttpServletResponse response);
    ApiResponse<String> setupPassword(SetupPasswordRequest request);
    ApiResponse<AuthResponse> refreshToken(HttpServletRequest request, HttpServletResponse response);
}
