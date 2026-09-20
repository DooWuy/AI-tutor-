package com.vn.aitutor.controller;

import com.vn.aitutor.dto.request.LoginRequest;
import com.vn.aitutor.dto.request.RegisterRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.AuthResponse;
import com.vn.aitutor.service.IAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        ApiResponse<AuthResponse> apiResponse = authService.login(request, response);
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        ApiResponse<AuthResponse> apiResponse = authService.register(request, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest request, HttpServletResponse response) {
        ApiResponse<String> apiResponse = authService.logout(request, response);
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        ApiResponse<AuthResponse> apiResponse = authService.refreshToken(request, response);
        return ResponseEntity.ok(apiResponse);
    }

    @PostMapping("/setup-password")
    public ResponseEntity<ApiResponse<String>> setupPassword(@Valid @RequestBody com.vn.aitutor.dto.request.SetupPasswordRequest request) {
        ApiResponse<String> apiResponse = authService.setupPassword(request);
        return ResponseEntity.ok(apiResponse);
    }
}
