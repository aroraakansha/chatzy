package com.application.chatzy_backend.message.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceMessageRequest {
    private UUID chatId;
    private UUID senderId;
    private UUID recipientId;
    private MultipartFile audioFile;
    private Integer durationSeconds;
}
