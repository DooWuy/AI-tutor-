package com.vn.aitutor.service.impl;

import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.dto.request.LoginRequest;
import com.vn.aitutor.dto.request.RegisterRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.AuthResponse;
import com.vn.aitutor.dto.response.UserResponse;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.jwt.JwtProvider;
import com.vn.aitutor.security.jwt.RefreshTokenService;
import com.vn.aitutor.security.jwt.TokenBlacklistService;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IAuthService;
import com.vn.aitutor.service.IMailService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthServiceImpl implements IAuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final RefreshTokenService refreshTokenService;
    private final IMailService mailService;

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

    @Override
    public ApiResponse<AuthResponse> login(LoginRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userPrincipal.getUsers();

        if (!user.isActive()) {
            throw new ResourceBadRequestException("Người dùng không hoạt động.");
        }

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        // Save refresh token to Redis
        refreshTokenService.saveRefreshToken(refreshToken);

        // Set HttpOnly Cookie for refresh token
        setRefreshTokenCookie(response, refreshToken);

        UserResponse userResponse = mapToUserResponse(user);

        return ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Đăng nhập thành công")
                .data(AuthResponse.builder()
                        .accessToken(accessToken)
                        .user(userResponse)
                        .build())
                .build();
    }

    @Override
    public ApiResponse<AuthResponse> register(RegisterRequest request, HttpServletResponse response) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ResourceBadRequestException("Mật khẩu xác nhận không khớp!");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceConflictException("Tên đăng nhập đã tồn tại!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceConflictException("Email đã được sử dụng!");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender() != null ? request.getGender() : Gender.OTHER);
        user.setRole(Role.STUDENT);
        user.setActive(true);

        User savedUser = userRepository.save(user);

        // Create Student profile
        Student student = new Student();
        student.setUser(savedUser);
        student.setStudentCode("STU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        student.setSchoolName(request.getSchoolName());
        student.setGradeLevel(request.getGradeLevel());
        student.setClassName(request.getClassName());
        student.setEmail(request.getEmail());
        studentRepository.save(student);

        String accessToken = jwtProvider.generateAccessToken(savedUser);
        String refreshToken = jwtProvider.generateRefreshToken(savedUser);

        // Save refresh token to Redis
        refreshTokenService.saveRefreshToken(refreshToken);

        // Set HttpOnly Cookie for refresh token
        setRefreshTokenCookie(response, refreshToken);

        // Send registration success email asynchronously
        mailService.sendRegistrationSuccessEmail(savedUser.getEmail(), savedUser.getFullName());
        log.info("Mock Email: Đăng ký thành công cho email " + savedUser.getEmail());

        UserResponse userResponse = mapToUserResponse(savedUser);

        return ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Đăng ký thành công")
                .data(AuthResponse.builder()
                        .accessToken(accessToken)
                        .user(userResponse)
                        .build())
                .build();
    }

    @Override
    public ApiResponse<String> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = getJwtFromRequest(request);
        if (StringUtils.hasText(token) && jwtProvider.validateToken(token, request)) {
            tokenBlacklistService.addTokenToBlacklist(token, "access");
        }

        String refreshToken = getRefreshTokenFromCookie(request);
        if (StringUtils.hasText(refreshToken)) {
            refreshTokenService.deleteRefreshToken(refreshToken);
        }

        clearRefreshTokenCookie(response);

        return ApiResponse.<String>builder()
                .success(true)
                .message("Đăng xuất thành công")
                .data("Logged out")
                .build();
    }

    @Override
    public ApiResponse<AuthResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String oldRefreshToken = getRefreshTokenFromCookie(request);
        
        if (!StringUtils.hasText(oldRefreshToken) || !refreshTokenService.isRefreshTokenValid(oldRefreshToken)) {
            clearRefreshTokenCookie(response);
            throw new ResourceBadRequestException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        // Token rotation: delete old refresh token
        refreshTokenService.deleteRefreshToken(oldRefreshToken);

        // Get user from old refresh token
        String username = jwtProvider.getUsernameFromToken(oldRefreshToken);
        if (username == null) {
            throw new ResourceBadRequestException("Refresh token không hợp lệ hoặc đã hết hạn");
        }
        
        User user = userRepository.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue(username)
                .orElseThrow(() -> new ResourceBadRequestException("Không tìm thấy người dùng"));

        // Generate new tokens
        String newAccessToken = jwtProvider.generateAccessToken(user);
        String newRefreshToken = jwtProvider.generateRefreshToken(user);

        // Save new refresh token and set cookie
        refreshTokenService.saveRefreshToken(newRefreshToken);
        setRefreshTokenCookie(response, newRefreshToken);

        UserResponse userResponse = mapToUserResponse(user);

        return ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Gia hạn token thành công")
                .data(AuthResponse.builder()
                        .accessToken(newAccessToken)
                        .user(userResponse)
                        .build())
                .build();
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .dateOfBirth(user.getDateOfBirth())
                .active(user.isActive())
                .isDeleted(user.isDeleted())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
