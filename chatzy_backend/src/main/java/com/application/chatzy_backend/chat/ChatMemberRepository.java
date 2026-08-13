package com.application.chatzy_backend.chat;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMemberRepository extends JpaRepository<ChatMember, UUID> {
    List<ChatMember> findByUserId(UUID userId);
    List<ChatMember> findByChatId(UUID chatId);
}
