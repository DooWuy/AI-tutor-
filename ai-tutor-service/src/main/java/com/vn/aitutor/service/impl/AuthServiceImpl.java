package com.vn.aitutor.service.impl;

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
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.jwt.JwtProvider;
import com.vn.aitutor.security.jwt.TokenBlacklistService;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IAuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    public ApiResponse<AuthResponse> login(LoginRequest request) {
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

        UserResponse userResponse = UserResponse.builder()
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

        return ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Đăng nhập thành công")
                .data(AuthResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .user(userResponse)
                        .build())
                .build();
    }

    @Override
    public ApiResponse<AuthResponse> register(RegisterRequest request) {
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
        user.setRole(Role.STUDENT);
        user.setGender(Gender.OTHER);
        user.setActive(true);

        User savedUser = userRepository.save(user);

        String accessToken = jwtProvider.generateAccessToken(savedUser);
        String refreshToken = jwtProvider.generateRefreshToken(savedUser);

        UserResponse userResponse = UserResponse.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .phoneNumber(savedUser.getPhoneNumber())
                .avatarUrl(savedUser.getAvatarUrl())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole().name())
                .gender(savedUser.getGender() != null ? savedUser.getGender().name() : null)
                .dateOfBirth(savedUser.getDateOfBirth())
                .active(savedUser.isActive())
                .isDeleted(savedUser.isDeleted())
                .createdAt(savedUser.getCreatedAt())
                .updatedAt(savedUser.getUpdatedAt())
                .build();

        return ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Đăng ký thành công")
                .data(AuthResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .user(userResponse)
                        .build())
                .build();
    }

    @Override
    public ApiResponse<String> logout(HttpServletRequest request) {
        String token = getJwtFromRequest(request);
        if (StringUtils.hasText(token) && jwtProvider.validateToken(token, request)) {
            tokenBlacklistService.addTokenToBlacklist(token, "access");
            return ApiResponse.<String>builder()
                    .success(true)
                    .message("Đăng xuất thành công")
                    .data("Token invalidated")
                    .build();
        }
        throw new ResourceBadRequestException("Token không hợp lệ để đăng xuất");
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
