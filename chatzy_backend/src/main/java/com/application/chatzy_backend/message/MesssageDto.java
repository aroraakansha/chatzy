package com.application.chatzy_backend.message;

import com.application.chatzy_backend.enums.MessageStatus;
import com.application.chatzy_backend.enums.MessageType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MesssageDto {

    private UUID id;

    private UUID chatId;

    private UUID senderId;

    private UUID recipientId;

    private String content;

    private String attachmentUrl;

    private String mediaUrl;

    private String mediaThumbnailUrl;

    private String mediaMimeType;

    private Long mediaSizeBytes;

    private Integer mediaDurationSecs;

    private MessageType type;

    private MessageStatus status;

    private LocalDateTime sentAt;

    private LocalDateTime createdAt;

    private LocalDateTime editedAt;

    private Boolean isEdited;

    private Boolean isDeleted;

    private UUID replyToMessageId;

    private String clientTempId; // wire-only, never persisted
}