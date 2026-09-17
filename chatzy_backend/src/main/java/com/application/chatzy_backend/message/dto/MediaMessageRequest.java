package com.application.chatzy_backend.message.dto;

import lombok.Builder;
import lombok.Value;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Value
@Builder
public class MediaMessageRequest {
    UUID chatId;
    UUID senderId;
    UUID recipientId;
    MultipartFile file;
    String content;
    String clientTempId;
}
