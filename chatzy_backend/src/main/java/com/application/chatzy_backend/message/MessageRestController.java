package com.application.chatzy_backend.message;

import com.application.chatzy_backend.message.dto.VoiceMessageRequest;
import com.application.chatzy_backend.message.dto.MediaMessageRequest;
import com.application.chatzy_backend.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageRestController {

    private final MessageService messageService;
    private final S3Service s3Service;

    @GetMapping("/{conversationId}")
    public ResponseEntity<Page<MesssageDto>> getChatMessages(
            @PathVariable UUID conversationId,
            Pageable pageable) {

        return ResponseEntity.ok(
                messageService.findMessagesByConversationPaginated(conversationId, pageable)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<Page<MesssageDto>> searchMessages(
            @RequestParam List<UUID> chatIds,
            @RequestParam String query,
            Pageable pageable) {

        return ResponseEntity.ok(
                messageService.searchMessages(chatIds, query, pageable)
        );
    }

    @GetMapping("/{conversationId}/search")
    public ResponseEntity<Page<MesssageDto>> searchMessagesInChat(
            @PathVariable UUID conversationId,
            @RequestParam String query,
            Pageable pageable) {

        return ResponseEntity.ok(
                messageService.searchMessagesInChat(conversationId, query, pageable)
        );
    }

    @PostMapping("/send")
    public ResponseEntity<MesssageDto> sendMessage(
            @RequestBody MesssageDto messageDto) {

        return ResponseEntity.ok(
                messageService.saveAndSendMessage(messageDto)
        );
    }

    @PostMapping("/voice")
    public ResponseEntity<MesssageDto> sendVoiceMessage(
            @RequestParam("chatId") UUID chatId,
            @RequestParam("senderId") UUID senderId,
            @RequestParam("recipientId") UUID recipientId,
            @RequestParam("audioFile") MultipartFile audioFile,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds) {

        VoiceMessageRequest request = VoiceMessageRequest.builder()
                .chatId(chatId)
                .senderId(senderId)
                .recipientId(recipientId)
                .audioFile(audioFile)
                .durationSeconds(durationSeconds)
                .build();

        return ResponseEntity.ok(
                messageService.saveAndSendVoiceMessage(request)
        );
    }

    @PostMapping("/media")
    public ResponseEntity<MesssageDto> sendMediaMessage(
            @RequestParam("chatId") UUID chatId,
            @RequestParam("senderId") UUID senderId,
            @RequestParam("recipientId") UUID recipientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "clientTempId", required = false) String clientTempId) {

        MediaMessageRequest request = MediaMessageRequest.builder()
                .chatId(chatId)
                .senderId(senderId)
                .recipientId(recipientId)
                .file(file)
                .content(content)
                .clientTempId(clientTempId)
                .build();

        return ResponseEntity.ok(messageService.saveAndSendMediaMessage(request));
    }

    @GetMapping("/media/{fileName}")
    public ResponseEntity<byte[]> getMediaFile(@PathVariable String fileName) {
        try {
            byte[] fileContent = s3Service.downloadFile(fileName);
            String contentType = determineContentType(fileName);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(fileContent.length);
            headers.setCacheControl("public, max-age=3600");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private String determineContentType(String fileName) {
        if (fileName.endsWith(".webm") || fileName.endsWith(".weba")) {
            return "audio/webm";
        } else if (fileName.endsWith(".mp3")) {
            return "audio/mpeg";
        } else if (fileName.endsWith(".wav")) {
            return "audio/wav";
        } else if (fileName.endsWith(".mp4")) {
            return "video/mp4";
        } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (fileName.endsWith(".png")) {
            return "image/png";
        } else if (fileName.endsWith(".gif")) {
            return "image/gif";
        } else if (fileName.endsWith(".pdf")) {
            return "application/pdf";
        }
        return "application/octet-stream";
    }
}
