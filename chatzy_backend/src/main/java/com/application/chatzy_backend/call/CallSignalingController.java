package com.application.chatzy_backend.call;

import com.application.chatzy_backend.call.dto.CallSignal;
import com.application.chatzy_backend.call.dto.WebRtcSignal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
@RequiredArgsConstructor
public class CallSignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final WebRtcSignalingService webRtcSignalingService;

    @MessageMapping("/call/signal")
    public void handleCallSignal(@Payload CallSignal signal) {
        log.info("Received call signal: type={}, from={}, to={}", 
                signal.getType(), signal.getSenderId(), signal.getReceiverId());

        // Forward the signal to the intended recipient
        messagingTemplate.convertAndSendToUser(
                signal.getReceiverId().toString(),
                "/queue/call-signals",
                signal
        );

        log.info("Forwarded signal to user: {}", signal.getReceiverId());
    }

    @MessageMapping("/webrtc/signal")
    public void handleWebRtcSignal(@Payload WebRtcSignal signal) {
        log.info("Received WebRTC signal: type={}, callId={}", signal.getType(), signal.getCallId());

        // Route based on signal type
        switch (signal.getType()) {
            case "offer":
                webRtcSignalingService.sendSdpOffer(signal.getCallId(), signal.getSdp());
                break;
            case "answer":
                webRtcSignalingService.sendSdpAnswer(signal.getCallId(), signal.getSdp());
                break;
            case "ice-candidate":
                // For ICE candidates via WebSocket, we need the sender ID from the principal
                // This will be handled by the REST endpoint for now
                log.warn("ICE candidates should be sent via REST endpoint");
                break;
            default:
                log.warn("Unknown WebRTC signal type: {}", signal.getType());
        }
    }
}
