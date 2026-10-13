package com.vn.aitutor.service;

public interface IMailService {
    void sendRegistrationSuccessEmail(String toEmail, String fullName);
    void sendAccountSetupEmail(String toEmail, String fullName, String username, String setupToken);

    void sendParentAlertEmail(String toEmail, String subject, String body);
    void sendClassReminderEmail(String toEmail, String fullName, String subjectName, String startTime, String room);
}
