package com.application.chatzy_backend.call;

import com.application.chatzy_backend.call.dto.CallRequest;
import com.application.chatzy_backend.call.dto.CallResponse;
import com.application.chatzy_backend.call.dto.IceCandidateRequest;
import com.application.chatzy_backend.call.dto.SdpAnswerRequest;
import com.application.chatzy_backend.call.dto.SdpOfferRequest;
import com.application.chatzy_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
public class CallController {

    private final CallService callService;
    private final UserRepository userRepository;
    private final WebRtcSignalingService webRtcSignalingService;

    @PostMapping("/initiate")
    public ResponseEntity<CallResponse> initiateCall(
            @RequestBody CallRequest request,
            Authentication authentication) {
        UUID callerId = currentUserId(authentication);
        CallResponse response = callService.initiateCall(callerId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{callId}/answer")
    public ResponseEntity<CallResponse> answerCall(
            @PathVariable UUID callId,
            Authentication authentication) {
        UUID receiverId = currentUserId(authentication);
        CallResponse response = callService.answerCall(callId, receiverId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{callId}/end")
    public ResponseEntity<CallResponse> endCall(
            @PathVariable UUID callId,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        CallResponse response = callService.endCall(callId, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{callId}/reject")
    public ResponseEntity<CallResponse> rejectCall(
            @PathVariable UUID callId,
            Authentication authentication) {
        UUID receiverId = currentUserId(authentication);
        CallResponse response = callService.rejectCall(callId, receiverId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{callId}/sdp-offer")
    public ResponseEntity<Void> sendSdpOffer(
            @PathVariable UUID callId,
            @RequestBody SdpOfferRequest request,
            Authentication authentication) {
        webRtcSignalingService.sendSdpOffer(callId, request.getSdpOffer());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{callId}/sdp-answer")
    public ResponseEntity<Void> sendSdpAnswer(
            @PathVariable UUID callId,
            @RequestBody SdpAnswerRequest request,
            Authentication authentication) {
        webRtcSignalingService.sendSdpAnswer(callId, request.getSdpAnswer());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{callId}/ice-candidate")
    public ResponseEntity<Void> sendIceCandidate(
            @PathVariable UUID callId,
            @RequestBody IceCandidateRequest request,
            Authentication authentication) {
        UUID senderId = currentUserId(authentication);
        webRtcSignalingService.sendIceCandidate(
                callId,
                request.getCandidate(),
                request.getSdpMid(),
                request.getSdpMLineIndex(),
                senderId
        );
        return ResponseEntity.ok().build();
    }

    @GetMapping("/ice-servers")
    public ResponseEntity<Object> getIceServers() {
        // Return ICE server configuration for WebRTC
        // Frontend will use this to configure RTCPeerConnection
        return ResponseEntity.ok(webRtcSignalingService.getIceServers());
    }

    private UUID currentUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"))
                .getId();
    }
}
