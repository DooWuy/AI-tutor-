package com.vn.aitutor.service.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.user.LoginRequest;
import com.vn.aitutor.dto.request.user.SetupPasswordRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.user.AuthResponse;
import com.vn.aitutor.entity.PasswordResetToken;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.PasswordResetTokenRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.jwt.JwtProvider;
import com.vn.aitutor.security.jwt.RefreshTokenService;
import com.vn.aitutor.security.jwt.TokenBlacklistService;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.user.AuthServiceImpl;
import com.vn.aitutor.service.system.IMailService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtProvider jwtProvider;
    @Mock private TokenBlacklistService tokenBlacklistService;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private IMailService mailService;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private HttpServletResponse response;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                userRepository,
                studentRepository,
                passwordEncoder,
                authenticationManager,
                jwtProvider,
                tokenBlacklistService,
                refreshTokenService,
                mailService,
                passwordResetTokenRepository
        );
    }

    @Test
    void setupPassword_tokenNotFound_throwsBadRequest() {
        SetupPasswordRequest request = new SetupPasswordRequest();
        request.setToken("invalid-token");

        when(passwordResetTokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        assertThrows(ResourceBadRequestException.class, () -> authService.setupPassword(request));
    }

    @Test
    void setupPassword_tokenAlreadyUsed_throwsBadRequest() {
        SetupPasswordRequest request = new SetupPasswordRequest();
        request.setToken("used-token");

        PasswordResetToken token = new PasswordResetToken();
        token.setUsed(true);

        when(passwordResetTokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        ResourceBadRequestException ex = assertThrows(ResourceBadRequestException.class, () -> authService.setupPassword(request));
        assertTrue(ex.getMessage().contains("đã được sử dụng"));
    }

    @Test
    void setupPassword_tokenExpired_throwsBadRequest() {
        SetupPasswordRequest request = new SetupPasswordRequest();
        request.setToken("expired-token");

        PasswordResetToken token = new PasswordResetToken();
        token.setUsed(false);
        token.setExpiryDate(LocalDateTime.now().minusHours(1));

        when(passwordResetTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        ResourceBadRequestException ex = assertThrows(ResourceBadRequestException.class, () -> authService.setupPassword(request));
        assertTrue(ex.getMessage().contains("hết hạn"));
    }

    @Test
    void setupPassword_validToken_encodesAndSavesUser() {
        SetupPasswordRequest request = new SetupPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("NewPass@123");

        User user = new User();
        user.setId(UUID.randomUUID());

        PasswordResetToken token = new PasswordResetToken();
        token.setToken("valid-token");
        token.setUser(user);
        token.setUsed(false);
        token.setExpiryDate(LocalDateTime.now().plusHours(12));

        when(passwordResetTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewPass@123")).thenReturn("hashed_new_pass");

        ApiResponse<String> apiResponse = authService.setupPassword(request);

        assertTrue(apiResponse.isSuccess());
        assertTrue(token.isUsed());
        assertEquals("hashed_new_pass", user.getPasswordHash());
        verify(userRepository).save(user);
        verify(passwordResetTokenRepository).save(token);
    }

    @Test
    void login_success_returnsAuthResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmail("user@aitutor.vn");
        request.setPassword("Pass@123");

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("user1");
        user.setEmail("user@aitutor.vn");
        user.setRole(Role.STUDENT);
        user.setGender(Gender.MALE);
        user.setActive(true);

        UserPrincipal principal = UserPrincipal.builder().users(user).build();
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(jwtProvider.generateAccessToken(user)).thenReturn("mock-access-token");
        when(jwtProvider.generateRefreshToken(user)).thenReturn("mock-refresh-token");

        ApiResponse<AuthResponse> result = authService.login(request, response);

        assertTrue(result.isSuccess());
        assertEquals("Đăng nhập thành công", result.getMessage());
        assertNotNull(result.getData());
        assertEquals("mock-access-token", result.getData().getAccessToken());
        verify(refreshTokenService).saveRefreshToken("mock-refresh-token");
    }

    @Test
    void login_inactiveUser_throwsBadRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail("inactive@aitutor.vn");
        request.setPassword("Pass@123");

        User user = new User();
        user.setActive(false); // Inactive

        UserPrincipal principal = UserPrincipal.builder().users(user).build();
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(principal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);

        assertThrows(ResourceBadRequestException.class, () -> authService.login(request, response));
    }
}
