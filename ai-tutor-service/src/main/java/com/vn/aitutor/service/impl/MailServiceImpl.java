package com.vn.aitutor.service.impl;

import com.vn.aitutor.service.IMailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements IMailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Override
    @Async
    public void sendRegistrationSuccessEmail(String toEmail, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Đăng ký tài khoản AI Tutor thành công");
            message.setText("Xin chào " + fullName + ",\n\n" +
                    "Chúc mừng bạn đã đăng ký thành công tài khoản trên hệ thống AI Tutor.\n" +
                    "Bây giờ bạn đã có thể đăng nhập và trải nghiệm các tính năng học tập thông minh.\n\n" +
                    "Trân trọng,\nĐội ngũ AI Tutor");
            
            mailSender.send(message);
            log.info("Đã gửi email thông báo đăng ký thành công đến: {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email đến {}: {}", toEmail, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendAccountCreatedByAdminEmail(String toEmail, String fullName, String username, String rawPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Tài khoản AI Tutor của bạn đã được tạo");
            message.setText("Xin chào " + fullName + ",\n\n" +
                    "Quản trị viên đã tạo cho bạn một tài khoản trên hệ thống AI Tutor.\n" +
                    "Thông tin đăng nhập của bạn là:\n" +
                    "- Tên đăng nhập: " + username + "\n" +
                    "- Mật khẩu tạm thời: " + rawPassword + "\n\n" +
                    "Vui lòng đăng nhập và đổi mật khẩu trong lần đầu tiên truy cập.\n\n" +
                    "Trân trọng,\nĐội ngũ AI Tutor");
            
            mailSender.send(message);
            log.info("Đã gửi email cấp tài khoản đến: {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email cấp tài khoản đến {}: {}", toEmail, e.getMessage());
        }
    }
}
