package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.request.StudentAdminCreateRequest;
import com.vn.aitutor.dto.request.StudentAdminUpdateRequest;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.PasswordResetTokenRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.ScheduleRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.service.impl.AdminStudentServiceImpl;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AdminStudentServiceTest {
    @Mock private StudentRepository studentRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private IMailService mailService;
    @Mock private ISchoolClassService schoolClassService;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private ChatSessionRepository chatSessionRepository;
    @Mock private ScheduleRepository scheduleRepository;
    @InjectMocks private AdminStudentServiceImpl service;

    @Test
    void duplicateUsernameIsRejectedBeforePersistence() {
        StudentAdminCreateRequest request = createRequest();
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(true);

        assertThrows(ResourceConflictException.class, () -> service.createStudent(request));
        verify(userRepository).existsByUsername(request.getUsername());
    }

    @Test
    void createStudentCreatesLinkedAccountAndSendsSetupEmail() {
        StudentAdminCreateRequest request = createRequest();
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(studentRepository.existsByStudentCode(any())).thenReturn(false);

        var response = service.createStudent(request);

        assertTrue(response.isSuccess());
        assertEquals("student@example.com", response.getData().getEmail());
        verify(tokenRepository).save(any());
        verify(mailService).sendAccountSetupEmail(any(), any(), any(), any());
    }

    @Test
    void updateDoesNotChangeIdentityFieldsAndStatusToggles() {
        UUID studentId = UUID.randomUUID();
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("original_user");
        user.setEmail("original@example.com");
        user.setActive(true);
        Student student = new Student();
        student.setId(studentId);
        student.setUser(user);
        student.setStudentCode("STU-ORIGINAL");
        when(studentRepository.findActiveStudentWithUserById(studentId)).thenReturn(Optional.of(student));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StudentAdminUpdateRequest request = new StudentAdminUpdateRequest();
        request.setFullName("Updated Name");
        request.setGender(Gender.FEMALE);
        service.updateStudent(studentId, request);
        assertEquals("original_user", user.getUsername());
        assertEquals("original@example.com", user.getEmail());
        assertEquals("STU-ORIGINAL", student.getStudentCode());
        assertEquals("Updated Name", user.getFullName());

        var status = service.toggleStudentStatus(studentId);
        assertFalse(status.getData().isActive());
    }

    @Test
    void softDeleteOnlyMarksUserDeleted() {
        UUID studentId = UUID.randomUUID();
        User user = new User();
        user.setId(UUID.randomUUID());
        Student student = new Student();
        student.setId(studentId);
        student.setUser(user);
        when(studentRepository.findActiveStudentWithUserById(studentId)).thenReturn(Optional.of(student));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.softDeleteStudent(studentId);

        assertTrue(user.isDeleted());
        verify(userRepository).save(user);
        verifyNoInteractions(quizAttemptRepository, chatSessionRepository, scheduleRepository);
    }

    private StudentAdminCreateRequest createRequest() {
        StudentAdminCreateRequest request = new StudentAdminCreateRequest();
        request.setUsername("student_user");
        request.setEmail("student@example.com");
        request.setPassword("Password1!");
        request.setFullName("Student Name");
        request.setSchoolName("School");
        request.setGradeLevel("8");
        return request;
    }
}
