package com.application.chatzy_backend.call;

import com.application.chatzy_backend.enums.CallStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CallRepository extends JpaRepository<Call, UUID> {
    
    List<Call> findByCallerIdOrReceiverId(UUID callerId, UUID receiverId);
    
    Optional<Call> findByIdAndStatus(UUID callId, String status);
    
    List<Call> findByCallerIdAndStatus(UUID callerId, String status);
    
    List<Call> findByReceiverIdAndStatus(UUID receiverId, String status);
    
    List<Call> findByStatus(CallStatus status);
}
