package com.vn.aitutor.service.system;

import com.vn.aitutor.service.system.IMailService;
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

    private String getSenderEmail() {
        if (fromEmail != null && !fromEmail.isBlank()) {
            return fromEmail.trim();
        }
        return "noreply@aitutor.vn";
    }

    @Override
    @Async
    public void sendRegistrationSuccessEmail(String toEmail, String fullName) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Bỏ qua gửi email đăng ký: toEmail rỗng");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getSenderEmail());
            message.setTo(toEmail.trim());
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
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Bỏ qua gửi email thiết lập: toEmail rỗng");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getSenderEmail());
            message.setTo(toEmail.trim());
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

    @Override
    public void sendParentAlertEmail(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("Địa chỉ email phụ huynh không được để trống");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(getSenderEmail());
        message.setTo(toEmail.trim());
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
        log.info("Đã gửi cảnh báo phụ huynh đến: {}", toEmail);
    }

    @Override
    @Async
    public void sendClassReminderEmail(String toEmail, String fullName, String subjectName, String startTime, String room) {
        if (toEmail == null || toEmail.isBlank()) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getSenderEmail());
            message.setTo(toEmail.trim());
            message.setSubject("⏰ [AI Tutor] Nhắc nhở tiết học: " + subjectName);
            
            String roomText = (room != null && !room.isBlank()) ? (" tại phòng " + room) : "";
            message.setText("Xin chào " + fullName + ",\n\n" +
                    "Hệ thống AI Tutor thông báo bạn có tiết học môn " + subjectName + " sắp bắt đầu vào lúc " + startTime + roomText + " (sau 15 phút nữa).\n\n" +
                    "Hãy chuẩn bị đầy đủ sách giáo khoa, vở ghi và đồ dùng học tập để sẵn sàng vào lớp nhé!\n\n" +
                    "Chúc bạn có một buổi học hiệu quả và đạt nhiều kết quả tốt.\n\n" +
                    "Trân trọng,\nĐội ngũ AI Tutor");
            
            mailSender.send(message);
            log.info("Đã gửi email nhắc nhở tiết học {} đến: {}", subjectName, toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email nhắc học đến {}: {}", toEmail, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendPasswordChangeOtpEmail(String toEmail, String fullName, String otpCode) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Bỏ qua gửi email mã OTP đổi mật khẩu: toEmail rỗng");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getSenderEmail());
            message.setTo(toEmail.trim());
            message.setSubject("🔑 [AI Tutor] Mã xác nhận đổi mật khẩu");
            message.setText("Xin chào " + fullName + ",\n\n" +
                    "Bạn vừa gửi yêu cầu đổi mật khẩu cho tài khoản trên hệ thống AI Tutor.\n\n" +
                    "Mã xác nhận (OTP) của bạn là: " + otpCode + "\n\n" +
                    "Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n" +
                    "Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với quản trị viên.\n\n" +
                    "Trân trọng,\nĐội ngũ AI Tutor");
            mailSender.send(message);
            log.info("Đã gửi email mã xác nhận đổi mật khẩu đến: {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email mã xác nhận đổi mật khẩu đến {}: {}", toEmail, e.getMessage());
        }
    }
}
