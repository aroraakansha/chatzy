package com.application.chatzy_backend.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Chatzy - Your OTP Code");
        message.setText("Your OTP code is: " + otp + "\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.");
        
        mailSender.send(message);
        log.info("OTP email sent to: {}", toEmail);
    }

    public void sendWelcomeEmail(String toEmail, String username) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Welcome to Chatzy!");
        message.setText("Hello " + username + ",\n\nWelcome to Chatzy! Your account has been successfully created.\n\nStart connecting with your friends and family today!\n\nBest regards,\nThe Chatzy Team");

        mailSender.send(message);
        log.info("Welcome email sent to: {}", toEmail);
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Chatzy - Reset Your Password");
        message.setText("Hello,\n\nYou requested to reset your password. Click the link below to reset your password:\n\n" + resetLink + "\n\nThis link will expire in 30 minutes.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nThe Chatzy Team");

        mailSender.send(message);
        log.info("Password reset email sent to: {}", toEmail);
    }

    public void logOtpForPhone(String phoneNumber, String otp) {
        log.info("OTP for phone number: {} is: {} (SMS integration needed for actual delivery)", phoneNumber, otp);
    }
}
