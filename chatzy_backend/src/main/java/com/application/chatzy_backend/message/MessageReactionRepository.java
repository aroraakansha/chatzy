package com.application.chatzy_backend.message;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, UUID> {

    Optional<MessageReaction> findByMessageIdAndUserId(UUID messageId, UUID userId);

    List<MessageReaction> findByMessageId(UUID messageId);

    void deleteByMessageIdAndUserId(UUID messageId, UUID userId);
}
