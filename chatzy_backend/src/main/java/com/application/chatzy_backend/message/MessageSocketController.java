package com.application.chatzy_backend.message;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageSocketController {

    private final MessageService messageService;

    @MessageMapping("/send")
    public void sendMessage(@Payload MesssageDto chatMessage) {
        messageService.saveAndSendMessage(chatMessage);
    }
}