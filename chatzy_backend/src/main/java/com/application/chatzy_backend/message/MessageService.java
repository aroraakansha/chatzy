package com.application.chatzy_backend.message;

import com.application.chatzy_backend.enums.MessageStatus;
import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    public MesssageDto saveAndSendMessage(MesssageDto incoming) {

        Message entity = toEntity(incoming);

        entity.setId(UUID.randomUUID());
        entity.setStatus(MessageStatus.SENT);
        entity.setSentAt(LocalDateTime.now());

        Message saved = messageRepository.save(entity);

        MesssageDto outgoing = toDto(saved);
        outgoing.setClientTempId(incoming.getClientTempId());

        // resolve the principal names (these must match the Principal.name set on CONNECT)
        String recipientPrincipal = resolvePrincipalName(saved.getRecipientId());

        log.info("Sending message - Recipient ID: {}, Resolved Principal: {}, Destination: /user/{}/queue/messages",
                saved.getRecipientId(), recipientPrincipal, recipientPrincipal);

        if (recipientPrincipal != null) {
            messagingTemplate.convertAndSendToUser(
                    recipientPrincipal,
                    "/queue/messages",
                    outgoing
            );
            log.info("Message sent to recipient: {}", recipientPrincipal);
        } else {
            log.warn("Could not resolve principal name for recipientId={}", saved.getRecipientId());
        }

        String senderPrincipal = resolvePrincipalName(saved.getSenderId());

        log.info("Sending message - Sender ID: {}, Resolved Principal: {}, Destination: /user/{}/queue/messages",
                saved.getSenderId(), senderPrincipal, senderPrincipal);

        if (senderPrincipal != null) {
            messagingTemplate.convertAndSendToUser(
                    senderPrincipal,
                    "/queue/messages",
                    outgoing
            );
            log.info("Message sent to sender: {}", senderPrincipal);
        } else {
            log.warn("Could not resolve principal name for senderId={}", saved.getSenderId());
        }

        return outgoing;
    }

    public List<MesssageDto> findMessagesByConversation(UUID chatId) {
        return messageRepository
                .findByChatIdOrderBySentAtAsc(chatId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public Page<MesssageDto> findMessagesByConversationPaginated(UUID chatId,
                                                                 Pageable pageable) {

        return messageRepository
                .findByChatIdOrderBySentAtDesc(chatId, pageable)
                .map(this::toDto);
    }

    private Message toEntity(MesssageDto dto) {

        return Message.builder()
                .id(dto.getId())
                .chatId(dto.getChatId())
                .senderId(dto.getSenderId())
                .recipientId(dto.getRecipientId())
                .content(dto.getContent())
                .attachmentUrl(dto.getAttachmentUrl())
                .mediaUrl(dto.getMediaUrl())
                .mediaThumbnailUrl(dto.getMediaThumbnailUrl())
                .mediaMimeType(dto.getMediaMimeType())
                .mediaSizeBytes(dto.getMediaSizeBytes())
                .mediaDurationSecs(dto.getMediaDurationSecs())
                .type(dto.getType())
                .status(dto.getStatus())
                .sentAt(dto.getSentAt())
                .createdAt(dto.getCreatedAt())
                .editedAt(dto.getEditedAt())
                .replyToMessageId(dto.getReplyToMessageId())
                .isDeleted(dto.getIsDeleted())
                .isEdited(dto.getIsEdited())
                .build();
    }

    private MesssageDto toDto(Message entity) {

        MesssageDto dto = new MesssageDto();

        dto.setId(entity.getId());
        dto.setChatId(entity.getChatId());
        dto.setSenderId(entity.getSenderId());
        dto.setRecipientId(entity.getRecipientId());
        dto.setContent(entity.getContent());
        dto.setAttachmentUrl(entity.getAttachmentUrl());
        dto.setMediaUrl(entity.getMediaUrl());
        dto.setMediaThumbnailUrl(entity.getMediaThumbnailUrl());
        dto.setMediaMimeType(entity.getMediaMimeType());
        dto.setMediaSizeBytes(entity.getMediaSizeBytes());
        dto.setMediaDurationSecs(entity.getMediaDurationSecs());
        dto.setType(entity.getType());
        dto.setStatus(entity.getStatus());
        dto.setSentAt(entity.getSentAt());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setEditedAt(entity.getEditedAt());
        dto.setReplyToMessageId(entity.getReplyToMessageId());
        dto.setIsDeleted(entity.getIsDeleted());
        dto.setIsEdited(entity.getIsEdited());

        return dto;
    }

    private String resolvePrincipalName(UUID userId) {

        if (userId == null) {
            return null;
        }

        return userRepository.findById(userId)
                .map(User::getEmail)
                .orElse(null);
    }
}