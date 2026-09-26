package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.request.ParentMessageSendRequest;
import com.vn.aitutor.dto.response.analytics.ParentMessageSendResponse;
import com.vn.aitutor.entity.ParentAlertMessage;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ParentChannel;
import com.vn.aitutor.entity.enums.ParentMessageStatus;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.ParentAlertMessageRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.impl.AtRiskService;
import com.vn.aitutor.service.impl.ParentMessageService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;

@ExtendWith(MockitoExtension.class)
class ParentMessageServiceTest {

    @Mock
    private AnalyticsAccess analyticsAccess;

    @Mock
    private AtRiskService atRiskService;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ParentAlertMessageRepository messageRepository;

    @Mock
    private IMailService mailService;

    @InjectMocks
    private ParentMessageService parentMessageService;

    @Test
    void unassignedTeacherCannotSend() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UserPrincipal principal = principal();
        when(analyticsAccess.requireReadableClass(principal, classId))
                .thenThrow(new ResourceForbiddenException("Giáo viên không được phân quyền xem lớp học này"));

        ParentMessageSendRequest request = request(classId, "A".repeat(60), List.of(ParentChannel.EMAIL));
        assertThrows(
                ResourceForbiddenException.class, () -> parentMessageService.send(principal, studentId, request));
    }

    @Test
    void bodyShorterThanFiftyIsRejected() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UserPrincipal principal = principal();
        SchoolClass schoolClass = schoolClass(classId);
        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass);
        when(studentRepository.findWithUserById(studentId)).thenReturn(Optional.of(student(studentId, schoolClass)));

        ParentMessageSendRequest request = request(classId, "A".repeat(49), List.of(ParentChannel.EMAIL));
        assertThrows(ResourceBadRequestException.class, () -> parentMessageService.send(principal, studentId, request));
    }

    @Test
    void bodyLongerThanOneThousandIsRejected() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UserPrincipal principal = principal();
        SchoolClass schoolClass = schoolClass(classId);
        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass);
        when(studentRepository.findWithUserById(studentId)).thenReturn(Optional.of(student(studentId, schoolClass)));

        ParentMessageSendRequest request = request(classId, "A".repeat(1001), List.of(ParentChannel.EMAIL));
        assertThrows(ResourceBadRequestException.class, () -> parentMessageService.send(principal, studentId, request));
    }

    @Test
    void emailIsSentAndSmsIsNotConfigured() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UserPrincipal principal = principal();
        SchoolClass schoolClass = schoolClass(classId);
        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass);
        when(studentRepository.findWithUserById(studentId)).thenReturn(Optional.of(student(studentId, schoolClass)));
        when(messageRepository.save(any())).thenAnswer(invocation -> {
            ParentAlertMessage message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            return message;
        });

        ParentMessageSendResponse response = parentMessageService.send(
                principal,
                studentId,
                request(classId, "A".repeat(60), List.of(ParentChannel.EMAIL, ParentChannel.SMS)));

        verify(mailService).sendParentAlertEmail(any(), any(), any());
        assertEquals(ParentMessageStatus.SENT, response.getResults().get(0).getStatus());
        assertEquals(ParentChannel.SMS, response.getResults().get(1).getChannel());
        assertEquals(ParentMessageStatus.NOT_CONFIGURED, response.getResults().get(1).getStatus());
    }

    @Test
    void smtpFailureIsStoredAsFailed() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UserPrincipal principal = principal();
        SchoolClass schoolClass = schoolClass(classId);
        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass);
        when(studentRepository.findWithUserById(studentId)).thenReturn(Optional.of(student(studentId, schoolClass)));
        when(messageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        org.mockito.Mockito.doThrow(new MailSendException("smtp down"))
                .when(mailService)
                .sendParentAlertEmail(any(), any(), any());

        ParentMessageSendResponse response = parentMessageService.send(
                principal, studentId, request(classId, "A".repeat(60), List.of(ParentChannel.EMAIL)));

        assertEquals(ParentMessageStatus.FAILED, response.getResults().get(0).getStatus());
        verify(messageRepository).save(any());
        verify(mailService).sendParentAlertEmail(any(), any(), any());
    }

    @Test
    void missingParentEmailDoesNotCallMail() {
        UUID classId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UserPrincipal principal = principal();
        SchoolClass schoolClass = schoolClass(classId);
        Student student = student(studentId, schoolClass);
        student.setParentEmail(null);
        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass);
        when(studentRepository.findWithUserById(studentId)).thenReturn(Optional.of(student));
        when(messageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ParentMessageSendResponse response = parentMessageService.send(
                principal, studentId, request(classId, "A".repeat(60), List.of(ParentChannel.EMAIL)));

        assertEquals(ParentMessageStatus.NOT_CONFIGURED, response.getResults().get(0).getStatus());
        verify(mailService, never()).sendParentAlertEmail(any(), any(), any());
    }

    private static ParentMessageSendRequest request(UUID classId, String body, List<ParentChannel> channels) {
        ParentMessageSendRequest request = new ParentMessageSendRequest();
        request.setClassId(classId);
        request.setBody(body);
        request.setChannels(channels);
        return request;
    }

    private static UserPrincipal principal() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.TEACHER);
        user.setFullName("Nguyễn Thị Giáo");
        return UserPrincipal.builder().users(user).build();
    }

    private static SchoolClass schoolClass(UUID classId) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(classId);
        schoolClass.setName("12A1");
        schoolClass.setSchoolName("THPT AI Tutor");
        return schoolClass;
    }

    private static Student student(UUID studentId, SchoolClass schoolClass) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName("Nguyễn Văn A");
        user.setActive(true);
        user.setDeleted(false);
        Student student = new Student();
        student.setId(studentId);
        student.setUser(user);
        student.setClassEntity(schoolClass);
        student.setStudentCode("STU-12A1-01");
        student.setParentEmail("phuhuynh.nguyenvana@aitutor.vn");
        return student;
    }
}
