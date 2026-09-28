package com.application.chatzy_backend.message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MessageService {

    private final Map<UUID, List<MesssageDto>> store = new ConcurrentHashMap<>();

    public Page<MesssageDto> findMessagesByConversationPaginated(UUID conversationId, Pageable pageable) {
        final List<MesssageDto> all = store.getOrDefault(conversationId, Collections.emptyList());

        // The frontend expects newest-first from the API; return a page of newest-first items
        List<MesssageDto> reversed = new ArrayList<>(all);
        Collections.reverse(reversed);

        int page = pageable.getPageNumber();
        int size = pageable.getPageSize();
        int start = Math.max(0, page * size);
        int end = Math.min(start + size, reversed.size());

        List<MesssageDto> content = start >= end ? Collections.emptyList() : reversed.subList(start, end);
        return new PageImpl<>(content, pageable, reversed.size());
    }

    public MesssageDto saveAndSendMessage(MesssageDto messageDto) {
        if (messageDto.getId() == null || messageDto.getId().isEmpty()) {
            messageDto.setId(UUID.randomUUID().toString());
        }

        String now = Instant.now().toString();
        messageDto.setSentAt(now);
        if (messageDto.getCreatedAt() == null) {
            messageDto.setCreatedAt(now);
        }

        UUID chatUuid;
        try {
            chatUuid = UUID.fromString(messageDto.getChatId());
        } catch (Exception ex) {
            // if chatId is not a UUID, create a deterministic UUID from the string
            chatUuid = UUID.nameUUIDFromBytes(messageDto.getChatId().getBytes());
        }

        store.computeIfAbsent(chatUuid, k -> Collections.synchronizedList(new ArrayList<>())).add(messageDto);

        // TODO: integrate STOMP/websocket push here. For now, we simply return the saved DTO.
        return messageDto;
    }
}
