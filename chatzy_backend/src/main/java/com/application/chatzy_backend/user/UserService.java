package com.application.chatzy_backend.user;

import com.application.chatzy_backend.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final S3Service s3Service;

    public ResponseEntity<AvatarResponse> setUserDisplayPicture(UUID userId, MultipartFile file) {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // 1. Find user FIRST, before uploading — avoid wasting an S3 call if user doesn't exist
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // 2. Upload to S3, get back public URL
        String publicUrl = s3Service.uploadFile(file);

        // 3. Delete old avatar if one exists (avoid orphaned files in S3)
        if (user.getAvatarUrl() != null) {
            s3Service.deleteFile(user.getAvatarUrl());
        }

        // 4. Save the new URL
        user.setAvatarUrl(publicUrl);
        userRepository.save(user);

        // 5. Return a proper response
        return ResponseEntity.ok(new AvatarResponse(publicUrl, Instant.now()));
    }
}
