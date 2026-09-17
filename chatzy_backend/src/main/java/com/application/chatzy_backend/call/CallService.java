package com.application.chatzy_backend.call;

import com.application.chatzy_backend.call.dto.CallRequest;
import com.application.chatzy_backend.call.dto.CallResponse;
import com.application.chatzy_backend.enums.CallStatus;
import com.application.chatzy_backend.enums.CallType;
import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
@Builder
public class CallService {

    private final CallRepository callRepository;
    private final CallParticipantRepository callParticipantRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    public CallResponse initiateCall(UUID callerId, CallRequest request) {
        // Check if there's already an active call between these users
        checkForActiveCalls(callerId, request.getReceiverId());

        Call call = Call.builder()
                .callerId(callerId)
                .receiverId(request.getReceiverId())
                .type(request.getType())
                .status(CallStatus.INITIATED)
                .chatId(request.getChatId())
                .build();

        call = callRepository.save(call);

        // Add caller as participant
        CallParticipant callerParticipant = CallParticipant.builder()
                .callId(call.getId())
                .userId(callerId)
                .build();
        callParticipantRepository.save(callerParticipant);

        // Change status to RINGING and notify both parties
        call.setStatus(CallStatus.RINGING);
        call = callRepository.save(call);

        CallResponse response = toDto(call);

        String receiverEmail = getUserEmail(request.getReceiverId());
        String callerEmail = getUserEmail(callerId);

        log.info("Sending call notification to receiver: {} (email: {})", request.getReceiverId(), receiverEmail);
        log.info("Sending call notification to caller: {} (email: {})", callerId, callerEmail);

        // Notify receiver first (they should see ringing UI and hear ringtone)
        messagingTemplate.convertAndSendToUser(
                receiverEmail,
                "/queue/calls",
                response
        );

        // Also notify caller (they should see "calling" status)
        messagingTemplate.convertAndSendToUser(
                callerEmail,
                "/queue/calls",
                response
        );

        log.info("Call initiated and ringing: {} from {} to {}", call.getId(), callerId, request.getReceiverId());
        return response;
    }

    public CallResponse answerCall(UUID callId, UUID receiverId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new IllegalArgumentException("Call not found"));

        if (!call.getReceiverId().equals(receiverId)) {
            throw new IllegalArgumentException("User is not the receiver of this call");
        }

        if (call.getStatus() != CallStatus.INITIATED && call.getStatus() != CallStatus.RINGING) {
            throw new IllegalArgumentException("Call cannot be answered in current status");
        }

        call.setStatus(CallStatus.CONNECTED);
        call.setStartedAt(OffsetDateTime.now());
        call = callRepository.save(call);

        // Add receiver as participant
        CallParticipant receiverParticipant = CallParticipant.builder()
                .callId(call.getId())
                .userId(receiverId)
                .build();
        callParticipantRepository.save(receiverParticipant);

        // Notify both parties
        CallResponse response = toDto(call);
        String callerEmail = getUserEmail(call.getCallerId());
        String receiverEmail = getUserEmail(call.getReceiverId());

        messagingTemplate.convertAndSendToUser(
                callerEmail,
                "/queue/calls",
                response
        );
        messagingTemplate.convertAndSendToUser(
                receiverEmail,
                "/queue/calls",
                response
        );

        log.info("Call answered: {}", callId);
        return response;
    }

    public CallResponse endCall(UUID callId, UUID userId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new IllegalArgumentException("Call not found"));

        if (!call.getCallerId().equals(userId) && !call.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("User is not a participant in this call");
        }

        if (call.getStatus() == CallStatus.ENDED) {
            return toDto(call);
        }

        call.setStatus(CallStatus.ENDED);
        call.setEndedAt(OffsetDateTime.now());

        if (call.getStartedAt() != null) {
            long duration = ChronoUnit.SECONDS.between(call.getStartedAt(), call.getEndedAt());
            call.setDurationSeconds((int) duration);
        }

        call = callRepository.save(call);

        // Update participant left time
        CallParticipant participant = callParticipantRepository
                .findByCallIdAndUserId(callId, userId)
                .orElse(null);
        if (participant != null) {
            participant.setLeftAt(OffsetDateTime.now());
            callParticipantRepository.save(participant);
        }

        // Notify both parties
        CallResponse response = toDto(call);
        String callerEmail = getUserEmail(call.getCallerId());
        String receiverEmail = getUserEmail(call.getReceiverId());

        messagingTemplate.convertAndSendToUser(
                callerEmail,
                "/queue/calls",
                response
        );
        messagingTemplate.convertAndSendToUser(
                receiverEmail,
                "/queue/calls",
                response
        );

        log.info("Call ended: {}", callId);
        return response;
    }

    public CallResponse rejectCall(UUID callId, UUID receiverId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new IllegalArgumentException("Call not found"));

        if (!call.getReceiverId().equals(receiverId)) {
            throw new IllegalArgumentException("User is not the receiver of this call");
        }

        call.setStatus(CallStatus.REJECTED);
        call.setEndedAt(OffsetDateTime.now());
        call = callRepository.save(call);

        // Notify caller
        CallResponse response = toDto(call);
        String callerEmail = getUserEmail(call.getCallerId());

        messagingTemplate.convertAndSendToUser(
                callerEmail,
                "/queue/calls",
                response
        );

        log.info("Call rejected: {}", callId);
        return response;
    }

    // Scheduled task to automatically end calls that are not answered within 30 seconds
    @Scheduled(fixedRate = 5000) // Run every 5 seconds
    public void checkForMissedCalls() {
        List<Call> ringingCalls = callRepository.findByStatus(CallStatus.RINGING);
        
        for (Call call : ringingCalls) {
            long secondsSinceCreation = ChronoUnit.SECONDS.between(call.getCreatedAt(), OffsetDateTime.now());
            
            // If call has been ringing for more than 30 seconds, end it
            if (secondsSinceCreation > 30) {
                call.setStatus(CallStatus.FAILED);
                call.setEndedAt(OffsetDateTime.now());
                call = callRepository.save(call);
                
                // Notify both parties
                CallResponse response = toDto(call);
                String callerEmail = getUserEmail(call.getCallerId());
                String receiverEmail = getUserEmail(call.getReceiverId());

                messagingTemplate.convertAndSendToUser(
                        callerEmail,
                        "/queue/calls",
                        response
                );
                messagingTemplate.convertAndSendToUser(
                        receiverEmail,
                        "/queue/calls",
                        response
                );

                log.info("Call missed/timeout: {} after {} seconds", call.getId(), secondsSinceCreation);
            }
        }
    }

    private void checkForActiveCalls(UUID callerId, UUID receiverId) {
        List<Call> activeCalls = callRepository.findByCallerIdOrReceiverId(callerId, receiverId);
        boolean hasActiveCall = activeCalls.stream()
                .anyMatch(call -> 
                    call.getStatus() == CallStatus.INITIATED || 
                    call.getStatus() == CallStatus.RINGING ||
                    call.getStatus() == CallStatus.CONNECTED);

        if (hasActiveCall) {
            throw new IllegalStateException("There is already an active call between these users");
        }
    }

    private CallResponse toDto(Call call) {
        return CallResponse.builder()
                .callId(call.getId())
                .callerId(call.getCallerId())
                .receiverId(call.getReceiverId())
                .type(call.getType())
                .status(call.getStatus())
                .chatId(call.getChatId())
                .startedAt(call.getStartedAt())
                .endedAt(call.getEndedAt())
                .durationSeconds(call.getDurationSeconds())
                .build();
    }

    private String getUserEmail(UUID userId) {
        return userRepository.findById(userId)
                .map(User::getEmail)
                .orElse(userId.toString());
    }
}
