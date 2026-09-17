package com.application.chatzy_backend.call.dto;

import com.application.chatzy_backend.enums.CallType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallRequest {
    private UUID receiverId;
    private CallType type;
    private UUID chatId;
}
