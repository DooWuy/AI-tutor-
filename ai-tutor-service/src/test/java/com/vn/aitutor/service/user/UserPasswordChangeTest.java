package com.vn.aitutor.service.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.user.ChangePasswordRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.PasswordResetTokenRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.otp.PasswordChangeOtpCache;
import com.vn.aitutor.security.principal.UserPrincipalCache;
import com.vn.aitutor.service.system.ICloudinaryService;
import com.vn.aitutor.service.system.IMailService;
import com.vn.aitutor.service.classroom.ISchoolClassService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class UserPasswordChangeTest {

    @Mock private UserRepository userRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private TeacherRepository teacherRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private IMailService mailService;
    @Mock private ICloudinaryService cloudinaryService;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private ISchoolClassService schoolClassService;
    @Mock private UserPrincipalCache userPrincipalCache;
    @Mock private PasswordChangeOtpCache passwordChangeOtpCache;

    private UserServiceImpl userService;
    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(
                userRepository,
                studentRepository,
                teacherRepository,
                passwordEncoder,
                mailService,
                cloudinaryService,
                passwordResetTokenRepository,
                schoolClassService,
                userPrincipalCache,
                passwordChangeOtpCache
        );

        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("hocsinh01");
        testUser.setEmail("hocsinh01@aitutor.vn");
        testUser.setFullName("Nguyen Van A");
        testUser.setPasswordHash("hashed_old_password");
        testUser.setActive(true);
        testUser.setDeleted(false);

        SecurityContext securityContext = mock(SecurityContext.class);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("hocsinh01", null);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void sendChangePasswordOtp_success() {
        when(userRepository.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue("hocsinh01"))
                .thenReturn(Optional.of(testUser));
        when(passwordChangeOtpCache.generateOtp(userId)).thenReturn("123456");

        ApiResponse<String> response = userService.sendChangePasswordOtp();

        assertTrue(response.isSuccess());
        assertTrue(response.getMessage().contains("Mã xác nhận đã được gửi về email"));
        verify(mailService).sendPasswordChangeOtpEmail(eq("hocsinh01@aitutor.vn"), eq("Nguyen Van A"), eq("123456"));
    }

    @Test
    void changePassword_success_withValidOtp() {
        when(userRepository.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue("hocsinh01"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPass@123", "hashed_old_password")).thenReturn(true);
        when(passwordEncoder.encode("NewPass@123")).thenReturn("hashed_new_password");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("OldPass@123");
        request.setNewPassword("NewPass@123");
        request.setConfirmPassword("NewPass@123");
        request.setOtp("123456");

        ApiResponse<String> response = userService.changePassword(request);

        assertTrue(response.isSuccess());
        assertEquals("Đổi mật khẩu thành công", response.getMessage());
        verify(passwordChangeOtpCache).validateAndConsumeOtp(userId, "123456");
        verify(userRepository).save(testUser);
        verify(userPrincipalCache).evict("hocsinh01");
        verify(userPrincipalCache).evict("hocsinh01@aitutor.vn");
    }

    @Test
    void changePassword_wrongOldPassword_throwsBadRequest() {
        when(userRepository.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue("hocsinh01"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("WrongPass@123", "hashed_old_password")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("WrongPass@123");
        request.setNewPassword("NewPass@123");
        request.setConfirmPassword("NewPass@123");
        request.setOtp("123456");

        ResourceBadRequestException ex = assertThrows(ResourceBadRequestException.class, () ->
                userService.changePassword(request));
        assertEquals("Mật khẩu cũ không chính xác", ex.getMessage());
        verify(passwordChangeOtpCache).validateAndConsumeOtp(userId, "123456");
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_samePassword_throwsBadRequest() {
        when(userRepository.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue("hocsinh01"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPass@123", "hashed_old_password")).thenReturn(true);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("OldPass@123");
        request.setNewPassword("OldPass@123");
        request.setConfirmPassword("OldPass@123");
        request.setOtp("123456");

        ResourceBadRequestException ex = assertThrows(ResourceBadRequestException.class, () ->
                userService.changePassword(request));
        assertEquals("Mật khẩu mới phải khác mật khẩu cũ", ex.getMessage());
        verify(userRepository, never()).save(any());
    }
}
