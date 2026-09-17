package com.application.chatzy_backend.call;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CallParticipantRepository extends JpaRepository<CallParticipant, UUID> {
    
    List<CallParticipant> findByCallId(UUID callId);
    
    List<CallParticipant> findByUserId(UUID userId);
    
    Optional<CallParticipant> findByCallIdAndUserId(UUID callId, UUID userId);
}
