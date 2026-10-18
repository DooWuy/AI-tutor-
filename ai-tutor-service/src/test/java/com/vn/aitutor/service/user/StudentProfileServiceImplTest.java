package com.vn.aitutor.service.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.user.StudentProfileUpdateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.user.StudentProfileResponse;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ProfileNotFoundException;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.user.StudentProfileServiceImpl;
import com.vn.aitutor.service.system.ICloudinaryService;
import com.vn.aitutor.service.validator.AvatarUploadValidator;
import com.vn.aitutor.service.gamification.StreakService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class StudentProfileServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private AvatarUploadValidator avatarUploadValidator;
    @Mock private ICloudinaryService cloudinaryService;
    @Mock private StreakService streaks;

    private StudentProfileServiceImpl service;
    private UUID userId;
    private User testUser;
    private Student testStudent;

    @BeforeEach
    void setUp() {
        service = new StudentProfileServiceImpl(
                userRepository,
                studentRepository,
                avatarUploadValidator,
                cloudinaryService,
                streaks
        );

        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("student1");
        testUser.setEmail("student1@aitutor.vn");
        testUser.setFullName("Nguyen Van B");
        testUser.setRole(Role.STUDENT);
        testUser.setActive(true);
        testUser.setDeleted(false);

        testStudent = new Student();
        testStudent.setId(UUID.randomUUID());
        testStudent.setUser(testUser);
        testStudent.setStudentCode("HS001");
        testStudent.setGradeLevel("10");
        testStudent.setClassName("10A1");
    }

    @Test
    void getMyProfile_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(testStudent));

        ApiResponse<StudentProfileResponse> response = service.getMyProfile(userId);

        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals("Nguyen Van B", response.getData().getFullName());
        assertEquals("HS001", response.getData().getStudentCode());
        assertEquals("10", response.getData().getGradeLevel());
    }

    @Test
    void getMyProfile_userNotFound_throwsProfileNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ProfileNotFoundException.class, () ->
                service.getMyProfile(userId));
    }

    @Test
    void getMyProfile_notStudentRole_throwsProfileNotFound() {
        testUser.setRole(Role.TEACHER);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        assertThrows(ProfileNotFoundException.class, () ->
                service.getMyProfile(userId));
    }

    @Test
    void getMyProfile_studentEntityNotFound_throwsProfileNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThrows(ProfileNotFoundException.class, () ->
                service.getMyProfile(userId));
    }

    @Test
    void updateMyProfile_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(testStudent));

        StudentProfileUpdateRequest request = new StudentProfileUpdateRequest();
        request.setFullName("Nguyen Van B Updated");
        request.setGender(Gender.MALE);
        request.setDateOfBirth(LocalDate.of(2008, 1, 15));
        request.setGradeLevel("11");
        request.setClassName("11A1");
        request.setStudyPreferences(Map.of("theme", "dark"));

        ApiResponse<StudentProfileResponse> response = service.updateMyProfile(userId, request);

        assertTrue(response.isSuccess());
        assertEquals("Nguyen Van B Updated", testUser.getFullName());
        assertEquals("11", testStudent.getGradeLevel());
        assertEquals("11A1", testStudent.getClassName());
        verify(userRepository).save(testUser);
        verify(studentRepository).save(testStudent);
    }

    @Test
    void uploadMyAvatar_success() throws IOException {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(testStudent));

        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", "avatar bytes".getBytes());
        when(cloudinaryService.uploadImage(file)).thenReturn("https://cloudinary.com/avatar.png");

        ApiResponse<StudentProfileResponse> response = service.uploadMyAvatar(userId, file);

        assertTrue(response.isSuccess());
        assertEquals("https://cloudinary.com/avatar.png", testUser.getAvatarUrl());
        verify(avatarUploadValidator).validate(file);
        verify(userRepository).save(testUser);
    }
}
