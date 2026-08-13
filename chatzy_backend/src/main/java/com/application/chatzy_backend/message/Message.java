package com.application.chatzy_backend.message;

import com.application.chatzy_backend.enums.MessageStatus;
import com.application.chatzy_backend.enums.MessageType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    private UUID id;

    @Column(name = "chat_id")
    private UUID chatId;

    @Column(name = "recipient_id")
    private UUID recipientId;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(length = 4000)
    private String content;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "media_thumbnail_url")
    private String mediaThumbnailUrl;

    @Column(name = "media_mime_type")
    private String mediaMimeType;

    @Column(name = "media_size_bytes")
    private Long mediaSizeBytes;

    @Column(name = "media_duration_secs")
    private Integer mediaDurationSecs;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    private MessageType type;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    private MessageStatus status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "reply_to_message_id")
    private UUID replyToMessageId;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "is_edited")
    private Boolean isEdited;
}