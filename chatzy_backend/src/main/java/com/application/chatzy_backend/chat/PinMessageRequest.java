package com.application.chatzy_backend.chat;

import lombok.Data;
import java.util.UUID;

@Data
public class PinMessageRequest {
    private UUID messageId;
}
