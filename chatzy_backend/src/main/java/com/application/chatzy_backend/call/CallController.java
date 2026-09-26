package com.application.chatzy_backend.call;

import com.application.chatzy_backend.call.dto.CallRequest;
import com.application.chatzy_backend.call.dto.CallResponse;
import com.application.chatzy_backend.call.dto.IceCandidateRequest;
import com.application.chatzy_backend.call.dto.SdpAnswerRequest;
import com.application.chatzy_backend.call.dto.SdpOfferRequest;
import com.application.chatzy_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@Slf4j
public class CallController {

    private final CallService callService;
    private final UserRepository userRepository;
    private final WebRtcSignalingService webRtcSignalingService;

    @PostMapping("/initiate")
    public ResponseEntity<CallResponse> initiateCall(
            @RequestBody CallRequest request,
            Authentication authentication) {
        log.info("POST /api/calls/initiate - Request: receiverId={}, type={}, chatId={}", 
                request.getReceiverId(), request.getType(), request.getChatId());
        UUID callerId = currentUserId(authentication);
        log.info("POST /api/calls/initiate - Caller ID: {}", callerId);
        CallResponse response = callService.initiateCall(callerId, request);
        log.info("POST /api/calls/initiate - Call initiated: {}", response.getCallId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{callId}/answer")
    public ResponseEntity<CallResponse> answerCall(
            @PathVariable UUID callId,
            Authentication authentication) {
        log.info("POST /api/calls/{}/answer - Call ID: {}", callId, callId);
        UUID receiverId = currentUserId(authentication);
        log.info("POST /api/calls/{}/answer - Receiver ID: {}", callId, receiverId);
        CallResponse response = callService.answerCall(callId, receiverId);
        log.info("POST /api/calls/{}/answer - Call answered successfully", callId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{callId}/end")
    public ResponseEntity<CallResponse> endCall(
            @PathVariable UUID callId,
            Authentication authentication) {
        log.info("POST /api/calls/{}/end - Call ID: {}", callId, callId);
        UUID userId = currentUserId(authentication);
        log.info("POST /api/calls/{}/end - User ID: {}", callId, userId);
        CallResponse response = callService.endCall(callId, userId);
        log.info("POST /api/calls/{}/end - Call ended successfully", callId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{callId}/reject")
    public ResponseEntity<CallResponse> rejectCall(
            @PathVariable UUID callId,
            Authentication authentication) {
        log.info("POST /api/calls/{}/reject - Call ID: {}", callId, callId);
        UUID receiverId = currentUserId(authentication);
        log.info("POST /api/calls/{}/reject - Receiver ID: {}", callId, receiverId);
        CallResponse response = callService.rejectCall(callId, receiverId);
        log.info("POST /api/calls/{}/reject - Call rejected successfully", callId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{callId}/sdp-offer")
    public ResponseEntity<Void> sendSdpOffer(
            @PathVariable UUID callId,
            @RequestBody SdpOfferRequest request,
            Authentication authentication) {
        log.info("POST /api/calls/{}/sdp-offer - Call ID: {}", callId, callId);
        webRtcSignalingService.sendSdpOffer(callId, request.getSdpOffer());
        log.info("POST /api/calls/{}/sdp-offer - SDP offer sent", callId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{callId}/sdp-answer")
    public ResponseEntity<Void> sendSdpAnswer(
            @PathVariable UUID callId,
            @RequestBody SdpAnswerRequest request,
            Authentication authentication) {
        log.info("POST /api/calls/{}/sdp-answer - Call ID: {}", callId, callId);
        webRtcSignalingService.sendSdpAnswer(callId, request.getSdpAnswer());
        log.info("POST /api/calls/{}/sdp-answer - SDP answer sent", callId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{callId}/ice-candidate")
    public ResponseEntity<Void> sendIceCandidate(
            @PathVariable UUID callId,
            @RequestBody IceCandidateRequest request,
            Authentication authentication) {
        UUID senderId = currentUserId(authentication);
        log.info("POST /api/calls/{}/ice-candidate - Call ID: {}, Sender ID: {}", callId, callId, senderId);
        webRtcSignalingService.sendIceCandidate(
                callId,
                request.getCandidate(),
                request.getSdpMid(),
                request.getSdpMLineIndex(),
                senderId
        );
        log.info("POST /api/calls/{}/ice-candidate - ICE candidate sent", callId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/ice-servers")
    public ResponseEntity<Object> getIceServers() {
        log.info("GET /api/calls/ice-servers - ICE servers requested");
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
