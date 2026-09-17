package com.application.chatzy_backend.call;

import com.application.chatzy_backend.call.dto.IceCandidateRequest;
import com.application.chatzy_backend.call.dto.SdpAnswerRequest;
import com.application.chatzy_backend.call.dto.SdpOfferRequest;
import com.application.chatzy_backend.call.dto.WebRtcSignal;
import com.application.chatzy_backend.config.WebRtcConfig;
import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebRtcSignalingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final CallRepository callRepository;
    private final WebRtcConfig webRtcConfig;

    public void sendSdpOffer(UUID callId, String sdpOffer) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new IllegalArgumentException("Call not found"));

        WebRtcSignal signal = WebRtcSignal.builder()
                .callId(callId)
                .type("offer")
                .sdp(sdpOffer)
                .build();

        // Send SDP offer to receiver
        String receiverPrincipal = resolvePrincipalName(call.getReceiverId());
        if (receiverPrincipal != null) {
            messagingTemplate.convertAndSendToUser(
                    receiverPrincipal,
                    "/queue/webrtc",
                    signal
            );
            log.info("SDP offer sent to receiver: {} for call: {}", receiverPrincipal, callId);
        }
    }

    public void sendSdpAnswer(UUID callId, String sdpAnswer) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new IllegalArgumentException("Call not found"));

        WebRtcSignal signal = WebRtcSignal.builder()
                .callId(callId)
                .type("answer")
                .sdp(sdpAnswer)
                .build();

        // Send SDP answer to caller
        String callerPrincipal = resolvePrincipalName(call.getCallerId());
        if (callerPrincipal != null) {
            messagingTemplate.convertAndSendToUser(
                    callerPrincipal,
                    "/queue/webrtc",
                    signal
            );
            log.info("SDP answer sent to caller: {} for call: {}", callerPrincipal, callId);
        }
    }

    public void sendIceCandidate(UUID callId, String candidate, String sdpMid, Integer sdpMLineIndex, UUID senderId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new IllegalArgumentException("Call not found"));

        WebRtcSignal signal = WebRtcSignal.builder()
                .callId(callId)
                .type("ice-candidate")
                .candidate(candidate)
                .sdpMid(sdpMid)
                .sdpMLineIndex(sdpMLineIndex)
                .build();

        // Determine recipient (if sender is caller, send to receiver, and vice versa)
        UUID recipientId = call.getCallerId().equals(senderId) ? call.getReceiverId() : call.getCallerId();
        String recipientPrincipal = resolvePrincipalName(recipientId);

        if (recipientPrincipal != null) {
            messagingTemplate.convertAndSendToUser(
                    recipientPrincipal,
                    "/queue/webrtc",
                    signal
            );
            log.info("ICE candidate sent from {} to {} for call: {}", senderId, recipientId, callId);
        }
    }

    public List<Map<String, Object>> getIceServers() {
        if (webRtcConfig.getIceServers() == null || webRtcConfig.getIceServers().isEmpty()) {
            // Return default Google STUN servers if none configured
            return List.of(
                Map.of("urls", "stun:stun.l.google.com:19302"),
                Map.of("urls", "stun:stun1.l.google.com:19302")
            );
        }
        
        return webRtcConfig.getIceServers().stream()
                .map(server -> {
                    Map<String, Object> serverMap = Map.of(
                        "urls", server.getUrls()
                    );
                    if (server.getUsername() != null && server.getCredential() != null) {
                        return Map.of(
                            "urls", server.getUrls(),
                            "username", server.getUsername(),
                            "credential", server.getCredential()
                        );
                    }
                    return serverMap;
                })
                .collect(Collectors.toList());
    }

    private String resolvePrincipalName(UUID userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .map(User::getEmail)
                .orElse(userId.toString());
    }
}
