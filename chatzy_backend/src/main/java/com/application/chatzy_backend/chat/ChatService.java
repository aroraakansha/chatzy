package com.application.chatzy_backend.chat;

import com.application.chatzy_backend.enums.ChatType;
import com.application.chatzy_backend.enums.MemberRole;
import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
@Service
@Slf4j
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;

    public ChatDto createPrivateChat(PrivateChatRequestDto request) {

        Chat chat = new Chat();
        chat.setId(UUID.randomUUID());
        chat.setType(ChatType.PRIVATE);
        chat.setCreatedBy(request.getCurrentUserId());
        chat.setCreatedAt(OffsetDateTime.now());
        chat.setLastActivityAt(OffsetDateTime.now());

        chat = chatRepository.save(chat);

        ChatMember sender = new ChatMember();
        sender.setId(UUID.randomUUID());
        sender.setChatId(chat.getId());
        sender.setUserId(request.getCurrentUserId());
        sender.setRole(MemberRole.MEMBER);
        sender.setIsMuted(false);
        sender.setIsArchived(false);
        sender.setJoinedAt(OffsetDateTime.now());

        chatMemberRepository.save(sender);

        ChatMember recipient = new ChatMember();
        recipient.setId(UUID.randomUUID());
        recipient.setChatId(chat.getId());
        recipient.setUserId(request.getRecipientId());
        recipient.setRole(MemberRole.MEMBER);
        recipient.setIsMuted(false);
        recipient.setIsArchived(false);
        recipient.setJoinedAt(OffsetDateTime.now());

        chatMemberRepository.save(recipient);

        return toDto(chat, request.getRecipientId());
    }

    public List<ChatDto> getUserChats(UUID userId) {
        List<ChatMember> userMemberships = chatMemberRepository.findByUserId(userId);
        log.info("Getting chats for user: {}, total memberships: {}", userId, userMemberships.size());
        
        return userMemberships.stream()
                .map(member -> {
                    Chat chat = chatRepository.findById(member.getChatId())
                            .orElse(null);
                    if (chat == null) {
                        log.warn("Chat not found for membership: {}", member.getChatId());
                        return null;
                    }
                    
                    log.info("Processing chat: {}, type: {}", chat.getId(), chat.getType());
                    
                    // For private chats, find the other user (recipient)
                    UUID recipientId = null;
                    String recipientName = null;
                    String recipientAvatar = null;
                    
                    if (chat.getType() == ChatType.PRIVATE) {
                        List<ChatMember> chatMembers = chatMemberRepository.findByChatId(member.getChatId());
                        log.info("Chat members for chat {}: {}", chat.getId(), chatMembers.size());
                        
                        ChatMember recipientMember = chatMembers.stream()
                                .filter(m -> !m.getUserId().equals(userId))
                                .findFirst()
                                .orElse(null);
                        
                        if (recipientMember != null) {
                            recipientId = recipientMember.getUserId();
                            User recipient = userRepository.findById(recipientId).orElse(null);
                            if (recipient != null) {
                                recipientName = recipient.getDisplayName();
                                recipientAvatar = recipient.getAvatarUrl();
                                log.info("Found recipient: {} ({})", recipientName, recipientId);
                            } else {
                                log.warn("Recipient user not found for ID: {}", recipientId);
                            }
                        } else {
                            log.warn("No recipient member found for chat: {}", chat.getId());
                        }
                    }
                    
                    ChatDto dto = toDto(chat, recipientId, recipientName, recipientAvatar);
                    log.info("Returning chat DTO - chatId: {}, recipientId: {}, recipientName: {}", 
                            dto.getChatId(), dto.getRecipientId(), dto.getRecipientName());
                    return dto;
                })
                .filter(dto -> dto != null)
                .toList();
    }

    public ChatDto findOrCreatePrivateChat(UUID userId, UUID recipientId) {
        // Check if a private chat already exists between these two users
        List<ChatMember> userMemberships = chatMemberRepository.findByUserId(userId);
        
        for (ChatMember membership : userMemberships) {
            Chat chat = chatRepository.findById(membership.getChatId()).orElse(null);
            if (chat != null && chat.getType() == ChatType.PRIVATE) {
                List<ChatMember> chatMembers = chatMemberRepository.findByChatId(chat.getId());
                boolean hasRecipient = chatMembers.stream()
                        .anyMatch(m -> m.getUserId().equals(recipientId));
                
                if (hasRecipient) {
                    // Chat exists, return it
                    User recipient = userRepository.findById(recipientId).orElse(null);
                    return toDto(chat, recipientId, 
                            recipient != null ? recipient.getDisplayName() : null,
                            recipient != null ? recipient.getAvatarUrl() : null);
                }
            }
        }
        
        // No existing chat, create a new one
        PrivateChatRequestDto request = new PrivateChatRequestDto();
        request.setCurrentUserId(userId);
        request.setRecipientId(recipientId);
        return createPrivateChat(request);
    }

    private ChatDto toDto(Chat chat, UUID recipientId) {
        return toDto(chat, recipientId, null, null);
    }

    private ChatDto toDto(Chat chat, UUID recipientId, String recipientName, String recipientAvatar) {

        ChatDto dto = new ChatDto();

        dto.setChatId(chat.getId());
        dto.setRecipientId(recipientId);
        dto.setRecipientName(recipientName);
        dto.setRecipientAvatar(recipientAvatar);
        dto.setChatName(chat.getName());
        dto.setAvatarUrl(chat.getAvatarUrl());
        dto.setType(chat.getType());
        dto.setLastActivityAt(chat.getLastActivityAt());

        return dto;
    }

    private Chat toEntity(ChatDto dto) {

        Chat chat = new Chat();

        chat.setId(dto.getChatId());
        chat.setName(dto.getChatName());
        chat.setAvatarUrl(dto.getAvatarUrl());
        chat.setType(dto.getType());

        return chat;
    }
}