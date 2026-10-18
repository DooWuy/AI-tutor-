package com.vn.aitutor.service.system;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.service.system.MailServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class MailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private MailServiceImpl mailService;

    @BeforeEach
    void setUp() {
        mailService = new MailServiceImpl(mailSender);
        ReflectionTestUtils.setField(mailService, "fromEmail", "admin@aitutor.vn");
    }

    @Test
    void sendRegistrationSuccessEmail_sendsProperMessage() {
        mailService.sendRegistrationSuccessEmail("user@example.com", "Nguyễn Văn A");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertEquals("user@example.com", sent.getTo()[0]);
        assertEquals("admin@aitutor.vn", sent.getFrom());
        assertTrue(sent.getSubject().contains("Đăng ký tài khoản AI Tutor thành công"));
        assertTrue(sent.getText().contains("Nguyễn Văn A"));
    }

    @Test
    void sendAccountSetupEmail_sendsSetupLinkWithToken() {
        mailService.sendAccountSetupEmail("student@example.com", "Trần Thị B", "student_b", "token123xyz");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertEquals("student@example.com", sent.getTo()[0]);
        assertTrue(sent.getSubject().contains("Thiết lập mật khẩu"));
        assertTrue(sent.getText().contains("token123xyz"));
        assertTrue(sent.getText().contains("student_b"));
    }

    @Test
    void sendParentAlertEmail_sendsAlertDirectly() {
        mailService.sendParentAlertEmail("parent@example.com", "Cảnh báo học tập", "Em cần cố gắng hơn");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertEquals("parent@example.com", sent.getTo()[0]);
        assertEquals("Cảnh báo học tập", sent.getSubject());
        assertEquals("Em cần cố gắng hơn", sent.getText());
    }

    @Test
    void sendParentAlertEmail_throwsOnBlankEmail() {
        assertThrows(IllegalArgumentException.class, () -> 
            mailService.sendParentAlertEmail("", "Subject", "Body")
        );
        assertThrows(IllegalArgumentException.class, () -> 
            mailService.sendParentAlertEmail(null, "Subject", "Body")
        );
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendClassReminderEmail_sendsClassInfo() {
        mailService.sendClassReminderEmail("student@example.com", "Lê Văn C", "Toán Học", "07:30", "Phòng 101");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage sent = captor.getValue();
        assertEquals("student@example.com", sent.getTo()[0]);
        assertTrue(sent.getSubject().contains("Toán Học"));
        assertTrue(sent.getText().contains("07:30"));
        assertTrue(sent.getText().contains("Phòng 101"));
    }

    @Test
    void fallbackSenderEmail_usedWhenFromEmailBlank() {
        ReflectionTestUtils.setField(mailService, "fromEmail", "");

        mailService.sendRegistrationSuccessEmail("user@example.com", "Nguyễn Văn D");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertEquals("noreply@aitutor.vn", captor.getValue().getFrom());
    }

    @Test
    void mailExceptionsAreHandledGracefullyInAsyncMethods() {
        doThrow(new MailSendException("SMTP timeout")).when(mailSender).send(any(SimpleMailMessage.class));

        // Should not throw exception to caller
        assertDoesNotThrow(() -> mailService.sendRegistrationSuccessEmail("fail@example.com", "User"));
        assertDoesNotThrow(() -> mailService.sendAccountSetupEmail("fail@example.com", "User", "uname", "tk"));
        assertDoesNotThrow(() -> mailService.sendClassReminderEmail("fail@example.com", "User", "Văn", "08:00", "A1"));
    }
}
