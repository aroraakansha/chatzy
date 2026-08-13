package com.application.chatzy_backend.auth;

import com.application.chatzy_backend.auth.dto.AuthResponse;
import com.application.chatzy_backend.user.LoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.security.Principal;
import com.application.chatzy_backend.user.User;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        authService.register(request.getEmail(), request.getPassword(), request.getDisplayName());
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        User user = authService.login(request.getEmail(), request.getPassword());
        String token = authService.createToken(user);

        return ResponseEntity.ok(new AuthResponse(token, "Login successful", user));
    }

    @GetMapping("/access/contact")
    public ResponseEntity<String> getCurrentUser(Principal principal) {
        // This will return the email/username of the person currently authenticated
        return ResponseEntity.ok("You are logged in as: " + principal.getName());
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> getCurrentUser(Authentication authentication) {
        User user = authService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(new AuthResponse.UserDto(user));
    }

    @GetMapping("/google")
    public RedirectView initiateGoogleOAuth2() {
        // Redirect to Spring Security's OAuth2 authorization endpoint
        // This will initiate the Google OAuth2 flow
        return new RedirectView("/oauth2/authorization/google");
    }

    @PostMapping("/sign-up")
    public ResponseEntity<String> sendOtp(@RequestBody SignUpRequest request) {
        authService.storePendingRegistration(request.getEmail(), request.getPhone(), request.getPassword(), request.getDisplayName());
        authService.sendOtpForRegistration(request.getEmail(), request.getPhone());
        return ResponseEntity.ok("OTP sent");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtpAndRegister(@RequestBody OtpRequest otpRequest) {
        AuthResponse response = authService.verifyOtpAndRegister(otpRequest.getEmail(), otpRequest.getPhone(), otpRequest.getCode());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody PasswordResetRequest request) {
        authService.sendPasswordResetLink(request.getEmail());
        return ResponseEntity.ok("Password reset link sent to your email");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody PasswordResetConfirmRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok("Password reset successfully");
    }
}
