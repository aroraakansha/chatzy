package com.application.chatzy_backend.message;

import com.application.chatzy_backend.enums.MessageStatus;
import com.application.chatzy_backend.enums.MessageType;
import com.application.chatzy_backend.message.dto.VoiceMessageRequest;
import com.application.chatzy_backend.message.dto.MediaMessageRequest;
import com.application.chatzy_backend.s3.S3Service;
import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @Autowired(required = false)
    private S3Service s3Service;

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
        String senderPrincipal = resolvePrincipalName(saved.getSenderId());

        log.info("Sending message - Recipient ID: {}, Resolved Principal: {}, Destination: /user/{}/queue/messages",
                saved.getRecipientId(), recipientPrincipal, recipientPrincipal);
        log.info("Sending message - Sender ID: {}, Resolved Principal: {}, Destination: /user/{}/queue/messages",
                saved.getSenderId(), senderPrincipal, senderPrincipal);
        log.info("Message content: {}", outgoing.getContent());

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

    public MesssageDto saveAndSendVoiceMessage(VoiceMessageRequest request) {
        if (s3Service == null) {
            throw new IllegalStateException("S3 service is not configured. Please configure AWS credentials to upload voice messages.");
        }

        // Upload audio file to S3
        String audioUrl = s3Service.uploadFile(request.getAudioFile());

        // Create message entity
        Message entity = Message.builder()
                .id(UUID.randomUUID())
                .chatId(request.getChatId())
                .senderId(request.getSenderId())
                .recipientId(request.getRecipientId())
                .mediaUrl(audioUrl)
                .mediaMimeType(request.getAudioFile().getContentType())
                .mediaSizeBytes(request.getAudioFile().getSize())
                .mediaDurationSecs(request.getDurationSeconds())
                .type(MessageType.AUDIO)
                .status(MessageStatus.SENT)
                .sentAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(entity);
        MesssageDto outgoing = toDto(saved);

        // Notify recipient
        String recipientPrincipal = resolvePrincipalName(saved.getRecipientId());
        if (recipientPrincipal != null) {
            messagingTemplate.convertAndSendToUser(
                    recipientPrincipal,
                    "/queue/messages",
                    outgoing
            );
            log.info("Voice message sent to recipient: {}", recipientPrincipal);
        }

        // Notify sender
        String senderPrincipal = resolvePrincipalName(saved.getSenderId());
        if (senderPrincipal != null) {
            messagingTemplate.convertAndSendToUser(
                    senderPrincipal,
                    "/queue/messages",
                    outgoing
            );
            log.info("Voice message sent to sender: {}", senderPrincipal);
        }

        return outgoing;
    }

    public MesssageDto saveAndSendMediaMessage(MediaMessageRequest request) {
        if (s3Service == null) {
            throw new IllegalStateException("S3 service is not configured. Please configure AWS credentials to upload media messages.");
        }

        String mediaUrl = s3Service.uploadFile(request.getFile());
        Message entity = Message.builder()
                .id(UUID.randomUUID())
                .chatId(request.getChatId())
                .senderId(request.getSenderId())
                .recipientId(request.getRecipientId())
                .content(request.getContent())
                .mediaUrl(mediaUrl)
                .mediaMimeType(request.getFile().getContentType())
                .mediaSizeBytes(request.getFile().getSize())
                .type(mediaTypeFor(request.getFile().getContentType()))
                .status(MessageStatus.SENT)
                .sentAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(entity);
        MesssageDto outgoing = toDto(saved);
        outgoing.setClientTempId(request.getClientTempId());
        notifyMessageParticipants(saved, outgoing);
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

    public Page<MesssageDto> searchMessages(List<UUID> chatIds, String query, Pageable pageable) {
        return messageRepository
                .searchMessages(chatIds, query, pageable)
                .map(this::toDto);
    }

    public Page<MesssageDto> searchMessagesInChat(UUID chatId, String query, Pageable pageable) {
        return messageRepository
                .searchMessagesInChat(chatId, query, pageable)
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

    private String resolvePrincipalName(String email) {
        if (email == null) {
            return null;
        }
        return email;
    }

    private MessageType mediaTypeFor(String mimeType) {
        if (mimeType != null && mimeType.startsWith("image/")) return MessageType.IMAGE;
        if (mimeType != null && mimeType.startsWith("video/")) return MessageType.VIDEO;
        return MessageType.FILE;
    }

    private void notifyMessageParticipants(Message message, MesssageDto outgoing) {
        String recipientPrincipal = resolvePrincipalName(message.getRecipientId());
        if (recipientPrincipal != null) {
            messagingTemplate.convertAndSendToUser(recipientPrincipal, "/queue/messages", outgoing);
        }
        String senderPrincipal = resolvePrincipalName(message.getSenderId());
        if (senderPrincipal != null) {
            messagingTemplate.convertAndSendToUser(senderPrincipal, "/queue/messages", outgoing);
        }
    }
}
