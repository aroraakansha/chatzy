package com.application.chatzy_backend.usercontacts.dto;


import com.application.chatzy_backend.usercontacts.UserContact;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserContactResponseDto(
        UUID id,
        String contactName,
        String contactEmail,
        String contactPhone,
        UUID matchedUserId,
        String matchedUserDisplayName,
        boolean isFavorite,
        boolean isBlocked
) {
    public static UserContactResponseDto from(UserContact contact) {
        return new UserContactResponseDto(
                contact.getId(),
                contact.getContactName(),
                contact.getContactEmail(),
                contact.getContactPhone(),
                contact.getMatchedUser() != null ? contact.getMatchedUser().getId() : null,
                contact.getMatchedUser() != null ? contact.getMatchedUser().getDisplayName() : null,
                contact.isFavorite(),
                contact.isBlocked()
        );
    }
}
