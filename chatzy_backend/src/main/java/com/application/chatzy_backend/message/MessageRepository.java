package com.application.chatzy_backend.message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByChatIdOrderBySentAtAsc(UUID chatId);

    Page<Message> findByChatIdOrderBySentAtDesc(UUID chatId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.chatId IN :chatIds AND m.content LIKE %:query% ORDER BY m.sentAt DESC")
    Page<Message> searchMessages(@Param("chatIds") List<UUID> chatIds, @Param("query") String query, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.chatId = :chatId AND m.content LIKE %:query% ORDER BY m.sentAt DESC")
    Page<Message> searchMessagesInChat(@Param("chatId") UUID chatId, @Param("query") String query, Pageable pageable);
}