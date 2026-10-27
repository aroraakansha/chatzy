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
        // If contact is saved, show saved name; otherwise show real user name
        String displayName = contact.getContactName();
        if (contact.getMatchedUser() != null && displayName == null) {
            displayName = contact.getMatchedUser().getDisplayName();
        }
        
        return new UserContactResponseDto(
                contact.getId(),
                displayName,
                contact.getContactEmail(),
                contact.getContactPhone(),
                contact.getMatchedUser() != null ? contact.getMatchedUser().getId() : null,
                contact.getMatchedUser() != null ? contact.getMatchedUser().getDisplayName() : null,
                contact.isFavorite(),
                contact.isBlocked()
        );
    }
}
