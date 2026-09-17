package com.application.chatzy_backend.call.dto;

import com.application.chatzy_backend.enums.CallStatus;
import com.application.chatzy_backend.enums.CallType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallResponse {
    private UUID callId;
    private UUID callerId;
    private UUID receiverId;
    private CallType type;
    private CallStatus status;
    private UUID chatId;
    private OffsetDateTime startedAt;
    private OffsetDateTime endedAt;
    private Integer durationSeconds;
}
