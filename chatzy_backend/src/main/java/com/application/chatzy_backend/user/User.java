package com.application.chatzy_backend.user;

import com.application.chatzy_backend.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data // Automatically generates getters, setters, toString
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String displayName;
    @Column(name = "phone_number")
    private String phone;

    @Column(name = "password", nullable = false)
    private String passwordHash;

    private String avatarUrl;

    @Column(columnDefinition = "TEXT DEFAULT 'Hey there! I am using WhatsApp.'")
    private String about;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Enumerated(EnumType.STRING)
    private UserStatus status;

    private OffsetDateTime lastSeen;

    private OffsetDateTime createdAt;

    // Add these fields to your com.application.chatzy_backend.user.User class

    @Column(name = "google_access_token")
    private String googleAccessToken;

    @Column(name = "google_refresh_token")
    private String googleRefreshToken;

    @Column(name = "token_expiry_at")
    private OffsetDateTime tokenExpiryAt;

    @Version
    private Long version = 0L;
}
