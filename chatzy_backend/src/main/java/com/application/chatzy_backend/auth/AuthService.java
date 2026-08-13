package com.application.chatzy_backend.auth;

import com.application.chatzy_backend.auth.dto.AuthResponse;
import com.application.chatzy_backend.email.EmailService;
import com.application.chatzy_backend.enums.UserStatus;
import com.application.chatzy_backend.otp.OtpService;
import com.application.chatzy_backend.passwordreset.PasswordResetToken;
import com.application.chatzy_backend.passwordreset.PasswordResetTokenRepository;
import com.application.chatzy_backend.security.JwtUtils; // Ensure this import is correct
import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils; // This must be declared here for injection
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // Temporary storage for pending registrations (in production, use Redis)
    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();

    private static class PendingRegistration {
        String email;
        String phone;
        String password;
        String displayName;
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPasswordHash()))
            throw new RuntimeException("Invalid password");

        return user;
    }

    public String createToken(User user) {
        return jwtUtils.generateToken(user.getEmail());
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    public void register(String email, String password, String displayName) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("User already exists");
        }
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(displayName);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setStatus(UserStatus.OFFLINE);

        // Generate a default username if one isn't provided
        user.setUsername(email.split("@")[0]);

        userRepository.save(user);
    }

    // FOR GOOGLE SIGNUP (OAuth2)
    public User registerOrUpdateGoogleUser(String email, String name, String refreshToken) {
        return userRepository.findByEmail(email)
                .map(existingUser -> {
                    // Update the existing user with the latest refresh token
                    existingUser.setGoogleRefreshToken(refreshToken);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Create a brand new user from Google profile
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setDisplayName(name);
                    newUser.setGoogleRefreshToken(refreshToken);
                    newUser.setStatus(UserStatus.OFFLINE);
                    return userRepository.save(newUser);
                });
    }

    @Transactional
    public void sendOtpForRegistration(String email, String phone) {
        // Check if user already exists
        if (email != null && !email.isEmpty() && userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("User already exists with this email");
        }
        if (phone != null && !phone.isEmpty() && userRepository.findByPhone(phone).isPresent()) {
            throw new RuntimeException("User already exists with this phone number");
        }

        // Generate and send OTP to email if provided
        if (email != null && !email.isEmpty()) {
            otpService.generateAndSendOtp(email, "REGISTRATION");
        }
        // Generate and send OTP to phone if provided
        else if (phone != null && !phone.isEmpty()) {
            otpService.generateAndSendOtp(phone, "REGISTRATION");
        } else {
            throw new RuntimeException("Either email or phone must be provided");
        }
    }

    @Transactional
    public AuthResponse verifyOtpAndRegister(String email, String phone, String otpCode) {
        // Validate OTP
        String identifier = (email != null && !email.isEmpty()) ? email : phone;
        log.info("Verifying OTP for identifier: {}", identifier);
        
        if (!otpService.validateOtp(identifier, otpCode)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        // Get pending registration data
        PendingRegistration pending = pendingRegistrations.get(identifier);
        log.info("Pending registrations map size: {}, looking for identifier: {}", pendingRegistrations.size(), identifier);
        
        if (pending == null) {
            log.error("No pending registration found for identifier: {}. Available keys: {}", identifier, pendingRegistrations.keySet());
            throw new RuntimeException("No pending registration found. Please start the registration process again.");
        }

        // Create user
        User user = new User();
        user.setPasswordHash(passwordEncoder.encode(pending.password));
        user.setDisplayName(pending.displayName);
        user.setEmail(pending.email);
        user.setPhone(pending.phone);
        user.setStatus(UserStatus.OFFLINE);

        // Generate username
        if (pending.email != null && !pending.email.isEmpty()) {
            user.setUsername(pending.email.split("@")[0]);
        } else if (pending.phone != null && !pending.phone.isEmpty()) {
            user.setUsername("user_" + pending.phone.substring(Math.max(0, pending.phone.length() - 4)));
        } else {
            user.setUsername("user_" + UUID.randomUUID().toString().substring(0, 8));
        }

        User savedUser = userRepository.save(user);

        // Send welcome message
        if (pending.email != null && !pending.email.isEmpty()) {
            emailService.sendWelcomeEmail(pending.email, pending.displayName);
        } else if (pending.phone != null && !pending.phone.isEmpty()) {
            log.info("User registered with phone number: {} (SMS welcome message integration needed)", pending.phone);
        }

        // Clean up pending registration
        pendingRegistrations.remove(identifier);

        // Generate JWT token
        String token = jwtUtils.generateToken(savedUser.getEmail() != null ? savedUser.getEmail() : savedUser.getPhone());

        return new AuthResponse(token, "Registration successful", savedUser);
    }

    public void storePendingRegistration(String email, String phone, String password, String displayName) {
        String identifier = (email != null && !email.isEmpty()) ? email : phone;
        PendingRegistration pending = new PendingRegistration();
        pending.email = email;
        pending.phone = phone;
        pending.password = password;
        pending.displayName = displayName;
        pendingRegistrations.put(identifier, pending);
    }

    private boolean isEmail(String identifier) {
        return identifier != null && identifier.contains("@");
    }

    public void sendPasswordResetLink(String email) {
        // Check if user exists
        if (userRepository.findByEmail(email).isEmpty()) {
            throw new RuntimeException("User not found with this email");
        }

        // Delete any existing reset tokens for this email
        passwordResetTokenRepository.deleteByEmail(email);

        // Generate reset token
        String resetToken = UUID.randomUUID().toString();

        // Calculate expiration time (30 minutes)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(30);

        // Save reset token
        PasswordResetToken token = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .email(email)
                .token(resetToken)
                .createdAt(now)
                .expiresAt(expiresAt)
                .used(false)
                .build();

        passwordResetTokenRepository.save(token);

        // Create reset link
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        // Send email
        emailService.sendPasswordResetEmail(email, resetLink);
    }

    public void resetPassword(String token, String newPassword) {
        // Find valid token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        // Check if token is expired
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }

        // Check if token is already used
        if (resetToken.isUsed()) {
            throw new RuntimeException("Reset token has already been used");
        }

        // Find user
        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }
}
