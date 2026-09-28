package com.application.chatzy_backend.message;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MesssageDto {
    private String id;
    private String chatId;
    private String senderId;
    private String recipientId;
    private String content;
    private String type;
    private String clientTempId;
    private String attachmentUrl;
    private String mediaUrl;
    private String mediaThumbnailUrl;
    private String mediaMimeType;
    private Long mediaSizeBytes;
    private Integer mediaDurationSecs;
    private String status;
    private String sentAt;
    private String createdAt;
    private String editedAt;
    private Boolean isEdited;
    private Boolean isDeleted;
    private String replyToMessageId;
}
