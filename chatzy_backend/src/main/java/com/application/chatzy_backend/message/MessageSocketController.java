package com.application.chatzy_backend.message;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

@Controller
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/send")
    public void sendMessage(@Payload MesssageDto chatMessage) {
        messageService.saveAndSendMessage(chatMessage);
    }

    @MessageMapping("/typing")
    public void handleTyping(@Payload Map<String, Object> payload, Authentication authentication) {
        String chatId = (String) payload.get("chatId");
        Boolean isTyping = (Boolean) payload.get("isTyping");
        String email = authentication.getName();

        Map<String, Object> typingNotification = Map.of(
            "chatId", chatId,
            "userEmail", email,
            "isTyping", isTyping
        );

        messagingTemplate.convertAndSend("/topic/typing/" + chatId, typingNotification);
    }

    @MessageMapping("/presence")
    @SendTo("/topic/presence")
    public Map<String, Object> handlePresence(@Payload Map<String, Object> payload, Authentication authentication) {
        String email = authentication.getName();
        String status = (String) payload.get("status");
        return Map.of("userEmail", email, "status", status);
    }

    @MessageMapping("/reaction")
    public void handleReaction(@Payload Map<String, Object> payload, Authentication authentication) {
        String messageId = (String) payload.get("messageId");
        String emoji = (String) payload.get("emoji");
        String action = (String) payload.get("action"); // "add" or "remove"
        String email = authentication.getName();

        Map<String, Object> reactionNotification = Map.of(
            "messageId", messageId,
            "emoji", emoji,
            "action", action,
            "userEmail", email
        );

        messagingTemplate.convertAndSend("/user/queue/reactions", reactionNotification);
    }

    @MessageMapping("/read")
    public void handleReadReceipt(@Payload Map<String, Object> payload, Authentication authentication) {
        String messageId = (String) payload.get("messageId");
        String email = authentication.getName();

        Map<String, Object> readReceipt = Map.of(
            "messageId", messageId,
            "userEmail", email,
            "readAt", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSend("/user/queue/read-receipts", readReceipt);
    }
}