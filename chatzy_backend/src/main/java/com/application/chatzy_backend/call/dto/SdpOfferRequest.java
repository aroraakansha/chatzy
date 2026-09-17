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
public class SdpOfferRequest {
    private UUID callId;
    private String sdpOffer;
}
