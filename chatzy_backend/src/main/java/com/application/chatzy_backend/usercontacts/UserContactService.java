package com.application.chatzy_backend.usercontacts;

import com.application.chatzy_backend.email.EmailService;
import com.application.chatzy_backend.exception.GoogleCredentialNotFoundException;
import com.application.chatzy_backend.googlecontactsaccess.GoogleContactDto;
import com.application.chatzy_backend.googlecontactsaccess.GoogleCredential;
import com.application.chatzy_backend.googlecontactsaccess.GoogleCredentialRepository;
import com.application.chatzy_backend.googlecontactsaccess.GooglePeopleApiContact;
import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import com.application.chatzy_backend.usercontacts.dto.AddContactRequest;
import com.application.chatzy_backend.usercontacts.dto.UserContactResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserContactService {

    private final UserContactRepository contactRepository;
    private final UserRepository userRepository;
    private final GoogleCredentialRepository googleCredentialRepository;
    private final GooglePeopleApiContact googlePeopleApiContact;
    private final EmailService emailService;

    @Value("${app.invitation.link:https://chatzy.app/download}")
    private String invitationLink;

    @Transactional(readOnly = true)
    public List<UserContact> getContactsForUser(UUID ownerId) {
        return contactRepository.findByOwnerId(ownerId);
    }

    @Transactional(readOnly = true)
    public boolean hasGoogleCredentials(UUID ownerId) {
        return googleCredentialRepository.existsById(ownerId);
    }

    @Transactional
    public void syncGoogleContacts(UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalStateException("Owner user not found"));

        GoogleCredential credential = googleCredentialRepository.findById(ownerId)
                .orElseThrow(() -> new GoogleCredentialNotFoundException(
                        "No Google credential found for this user. Please sign in with Google and grant contacts access first."));

        System.out.println("DEBUG: Starting Google Contacts sync for user: " + owner.getEmail());
        System.out.println("DEBUG: Access Token: " + (credential.getAccessToken() != null ? "Present" : "NULL"));
        System.out.println("DEBUG: Token Expires At: " + credential.getAccessTokenExpiresAt());

        List<GoogleContactDto> googleContacts =
                googlePeopleApiContact.fetchContacts(credential.getAccessToken());

        System.out.println("DEBUG: Fetched " + googleContacts.size() + " contacts from Google");

        for (GoogleContactDto gc : googleContacts) {
            boolean alreadyImported =
                    (gc.email() != null && contactRepository.existsByOwnerIdAndContactEmail(ownerId, gc.email()))
                            || (gc.phone() != null && contactRepository.existsByOwnerIdAndContactPhone(ownerId, gc.phone()));

            if (alreadyImported) continue;

            UserContact contact = UserContact.builder()
                    .owner(owner)
                    .contactName(gc.name())
                    .contactEmail(gc.email())
                    .contactPhone(gc.phone())
                    .source("GOOGLE")
                    .build();

            contactRepository.save(contact);
        }

        linkContactsToPlatformUsers(ownerId);
    }

    @Transactional
    public void linkContactsToPlatformUsers(UUID ownerId) {
        List<UserContact> contacts = contactRepository.findByOwnerId(ownerId);

        contacts.stream().filter(contact -> contact.getMatchedUser() == null).filter(contact -> contact.getContactEmail() != null).forEach(contact -> {
            Optional<User> match = userRepository.findByEmail(contact.getContactEmail());
            if (match.isPresent() && !match.get().getId().equals(ownerId)) {
                contact.setMatchedUser(match.get());
                contactRepository.save(contact);
            }
        });
    }


    @Transactional
    public List<UserContactResponseDto> getContactsForUserDto(UUID ownerId) {
        List<UserContact> userContacts = contactRepository.findByOwnerId(ownerId);

        for (UserContact contact : userContacts) {
            // Skip if already linked
            if (contact.getMatchedUser() != null) {
                continue;
            }

            Optional<User> matchedUser = Optional.empty();

            // Try matching by email
            if (contact.getContactEmail() != null && !contact.getContactEmail().isBlank()) {
                matchedUser = userRepository.findByEmail(contact.getContactEmail().trim());
                log.info("Tried email match for {}: {}", contact.getContactEmail(), matchedUser.isPresent());
            }

            // If email didn't match, try matching by phone
            if (matchedUser.isEmpty() && contact.getContactPhone() != null && !contact.getContactPhone().isBlank()) {
                // Normalize phone number by removing non-digit characters
                String normalizedPhone = contact.getContactPhone().replaceAll("[^0-9]", "");
                matchedUser = userRepository.findByPhone(normalizedPhone);
                log.info("Tried phone match for {} -> normalized: {}: {}", contact.getContactPhone(), normalizedPhone, matchedUser.isPresent());
            }

            // Link to matched user if found and not the owner
            if (matchedUser.isPresent() && !matchedUser.get().getId().equals(ownerId)) {
                contact.setMatchedUser(matchedUser.get());
                contactRepository.save(contact);
                log.info("Linked contact {} to user {}", contact.getContactName(), matchedUser.get().getEmail());
            }
        }

        // Return every saved contact. The UI marks contacts who have not joined Chatzy yet.
        return userContacts.stream()
                .map(UserContactResponseDto::from)
                .toList();
    }

    @Transactional
    public UserContactResponseDto addContact(UUID ownerId, AddContactRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalStateException("Owner user not found"));

        // Check if contact already exists
        if (request.getContactEmail() != null && !request.getContactEmail().isBlank()) {
            if (contactRepository.existsByOwnerIdAndContactEmail(ownerId, request.getContactEmail())) {
                throw new IllegalStateException("Contact with this email already exists");
            }
        }
        if (request.getContactPhone() != null && !request.getContactPhone().isBlank()) {
            if (contactRepository.existsByOwnerIdAndContactPhone(ownerId, request.getContactPhone())) {
                throw new IllegalStateException("Contact with this phone already exists");
            }
        }

        UserContact contact = UserContact.builder()
                .owner(owner)
                .contactName(request.getContactName())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .source("MANUAL")
                .build();

        contact = contactRepository.save(contact);

        // Try to match with existing user
        Optional<User> matchedUser = Optional.empty();
        if (request.getContactEmail() != null && !request.getContactEmail().isBlank()) {
            matchedUser = userRepository.findByEmail(request.getContactEmail().trim());
        }
        if (matchedUser.isEmpty() && request.getContactPhone() != null && !request.getContactPhone().isBlank()) {
            String normalizedPhone = request.getContactPhone().replaceAll("[^0-9]", "");
            matchedUser = userRepository.findByPhone(normalizedPhone);
        }

        if (matchedUser.isPresent() && !matchedUser.get().getId().equals(ownerId)) {
            contact.setMatchedUser(matchedUser.get());
            contact = contactRepository.save(contact);
            log.info("Contact matched with existing user: {}", matchedUser.get().getEmail());
        } else {
            // Contact is not a registered user, send invitation email
            if (request.getContactEmail() != null && !request.getContactEmail().isBlank()) {
                try {
                    emailService.sendInvitationEmail(
                            request.getContactEmail(),
                            owner.getDisplayName(),
                            invitationLink
                    );
                    log.info("Invitation email sent to: {}", request.getContactEmail());
                } catch (Exception e) {
                    log.error("Failed to send invitation email to: {}", request.getContactEmail(), e);
                    // Don't fail the contact addition if email fails
                }
            }
        }

        return UserContactResponseDto.from(contact);
    }

    @Transactional(readOnly = true)
    public List<UserContactResponseDto> searchContacts(UUID ownerId, String query) {
        List<UserContact> contacts = contactRepository.searchContacts(ownerId, query);
        return contacts.stream()
                .map(UserContactResponseDto::from)
                .toList();
    }
}
