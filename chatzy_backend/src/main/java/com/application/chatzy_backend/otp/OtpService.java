package com.application.chatzy_backend.otp;

import com.application.chatzy_backend.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;

    @Value("${otp.expiration.minutes:10}")
    private int otpExpirationMinutes;

    @Value("${otp.length:6}")
    private int otpLength;

    private static final String NUMBERS = "0123456789";
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public String generateAndSendOtp(String identifier, String purpose) {
        // Delete any existing OTPs for this identifier
        otpRepository.deleteByIdentifier(identifier);

        // Generate OTP code
        String otpCode = generateOtpCode();

        // Calculate expiration time
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(otpExpirationMinutes);

        // Save OTP to database
        Otp otp = Otp.builder()
                .identifier(identifier)
                .code(otpCode)
                .createdAt(now)
                .expiresAt(expiresAt)
                .used(false)
                .purpose(purpose)
                .build();

        otpRepository.save(otp);

        // Send OTP (email or phone)
        if (isEmail(identifier)) {
            emailService.sendOtpEmail(identifier, otpCode);
            log.info("OTP generated and sent to email: {} for purpose: {}", identifier, purpose);
        } else {
            emailService.logOtpForPhone(identifier, otpCode);
            log.info("OTP generated for phone: {} for purpose: {} (OTP logged for SMS integration)", identifier, purpose);
        }

        return otpCode;
    }

    @Transactional
    public boolean validateOtp(String identifier, String code) {
        LocalDateTime now = LocalDateTime.now();

        return otpRepository.findValidOtp(identifier, code, now)
                .map(otp -> {
                    // Mark OTP as used
                    otp.setUsed(true);
                    otpRepository.save(otp);
                    log.info("OTP validated successfully for identifier: {}", identifier);
                    return true;
                })
                .orElse(false);
    }

    private boolean isEmail(String identifier) {
        return identifier != null && identifier.contains("@");
    }

    private String generateOtpCode() {
        StringBuilder sb = new StringBuilder(otpLength);
        for (int i = 0; i < otpLength; i++) {
            sb.append(NUMBERS.charAt(random.nextInt(NUMBERS.length())));
        }
        return sb.toString();
    }
}
