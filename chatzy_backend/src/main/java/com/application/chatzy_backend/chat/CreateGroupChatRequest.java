package com.application.chatzy_backend.chat;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreateGroupChatRequest {
    private String name;
    private String description;
    private List<UUID> memberIds;
}
