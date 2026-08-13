package com.application.chatzy_backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping("/auth")
    public User getCurrentUser() {
        // Extract username from the SecurityContext populated by the JwtAuthenticationFilter
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PutMapping("/{userId}/avatar")
    public ResponseEntity<AvatarResponse> setUserDisplayPicture(
            @PathVariable UUID userId,
            @RequestParam("file") MultipartFile file) {

        return userService.setUserDisplayPicture(userId, file);
    }

}
