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
    public void sendAccountSetupEmail(String toEmail, String fullName, String username, String setupToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Thiết lập mật khẩu tài khoản AI Tutor");
            
            // Link giả lập frontend URL
            String setupLink = "https://aitutor.vn/setup-password?token=" + setupToken;
            
            message.setText("Xin chào " + fullName + ",\n\n" +
                    "Quản trị viên đã tạo cho bạn một tài khoản trên hệ thống AI Tutor với tên đăng nhập: " + username + "\n" +
                    "Để bảo mật, vui lòng click vào đường link dưới đây để tự thiết lập mật khẩu của mình (Link có hiệu lực trong 24 giờ):\n" +
                    setupLink + "\n\n" +
                    "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\n" +
                    "Trân trọng,\nĐội ngũ AI Tutor");
            
            mailSender.send(message);
            log.info("Đã gửi email yêu cầu thiết lập mật khẩu đến: {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email cấp tài khoản đến {}: {}", toEmail, e.getMessage());
        }
    }
}
