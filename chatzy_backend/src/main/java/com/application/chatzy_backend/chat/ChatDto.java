package com.application.chatzy_backend.chat;

import com.application.chatzy_backend.enums.ChatType;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class ChatDto {

    private UUID chatId;

    private UUID recipientId;

    private String recipientName;

    private String recipientAvatar;

    private String chatName;

    private String avatarUrl;

    private ChatType type;

    private OffsetDateTime lastActivityAt;

}
