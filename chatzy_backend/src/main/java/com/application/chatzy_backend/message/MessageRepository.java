package com.application.chatzy_backend.message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByChatIdOrderBySentAtAsc(UUID chatId);

    Page<Message> findByChatIdOrderBySentAtDesc(UUID chatId, Pageable pageable);
}