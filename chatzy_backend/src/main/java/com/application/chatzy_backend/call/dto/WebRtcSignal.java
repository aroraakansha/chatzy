package com.application.chatzy_backend.call.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebRtcSignal {
    private UUID callId;
    private String type; // "offer", "answer", "ice-candidate"
    private String sdp;
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
}
