package com.application.chatzy_backend.call.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallSignal {
    private UUID callId;
    private UUID senderId;
    private UUID receiverId;
    private String type; // offer, answer, ice-candidate
    private String data;
}
