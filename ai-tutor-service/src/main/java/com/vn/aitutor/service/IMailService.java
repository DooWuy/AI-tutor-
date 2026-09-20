package com.vn.aitutor.service;

public interface IMailService {
    void sendRegistrationSuccessEmail(String toEmail, String fullName);
    void sendAccountSetupEmail(String toEmail, String fullName, String username, String setupToken);
}
