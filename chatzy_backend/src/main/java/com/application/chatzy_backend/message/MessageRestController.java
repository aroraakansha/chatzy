package com.application.chatzy_backend.message;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageRestController {

    private final MessageService messageService;

    @GetMapping("/{conversationId}")
    public ResponseEntity<Page<MesssageDto>> getChatMessages(
            @PathVariable UUID conversationId,
            Pageable pageable) {

        return ResponseEntity.ok(
                messageService.findMessagesByConversationPaginated(conversationId, pageable)
        );
    }

    @PostMapping("/send")
    public ResponseEntity<MesssageDto> sendMessage(
            @RequestBody MesssageDto messageDto) {

        return ResponseEntity.ok(
                messageService.saveAndSendMessage(messageDto)
        );
    }
}