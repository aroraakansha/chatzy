package com.application.chatzy_backend.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final com.application.chatzy_backend.user.UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ChatDto>> getUserChats(Authentication authentication) {
        UUID userId = currentUserId(authentication);
        List<ChatDto> chats = chatService.getUserChats(userId);
        return ResponseEntity.ok(chats);
    }

    @PostMapping("/private")
    public ChatDto createPrivateChat(
            @RequestBody PrivateChatRequestDto request) {

        return chatService.createPrivateChat(request);
    }

    @GetMapping("/private/{recipientId}")
    public ResponseEntity<ChatDto> findOrCreatePrivateChat(
            @PathVariable UUID recipientId,
            Authentication authentication) {
        UUID userId = currentUserId(authentication);
        ChatDto chat = chatService.findOrCreatePrivateChat(userId, recipientId);
        return ResponseEntity.ok(chat);
    }

    private UUID currentUserId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"))
                .getId();
    }
}
