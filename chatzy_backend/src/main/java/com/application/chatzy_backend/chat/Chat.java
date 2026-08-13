package com.application.chatzy_backend.chat;


import com.application.chatzy_backend.enums.ChatType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "chats")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Chat {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    private ChatType type;

    private String name;

    private String description;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "last_message_id")
    private UUID lastMessageId;

    @Column(name = "last_activity_at")
    private OffsetDateTime lastActivityAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}