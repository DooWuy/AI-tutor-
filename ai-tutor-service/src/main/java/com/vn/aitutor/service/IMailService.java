package com.vn.aitutor.service;

public interface IMailService {
    void sendRegistrationSuccessEmail(String toEmail, String fullName);
    void sendAccountCreatedByAdminEmail(String toEmail, String fullName, String username, String rawPassword);
}
