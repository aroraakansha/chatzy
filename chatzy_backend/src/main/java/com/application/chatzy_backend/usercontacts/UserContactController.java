package com.application.chatzy_backend.usercontacts;

import com.application.chatzy_backend.usercontacts.dto.AddContactRequest;
import com.application.chatzy_backend.usercontacts.dto.UserContactResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class UserContactController {

    private final UserContactService contactService;
    private final com.application.chatzy_backend.user.UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserContactResponseDto>> getMyContacts(Authentication authentication) {
        UUID ownerId = currentUserId(authentication);
        List<UserContactResponseDto> result = contactService.getContactsForUserDto(ownerId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sync-status")
    public ResponseEntity<Map<String, Boolean>> checkGoogleCredentials(Authentication authentication) {
        UUID ownerId = currentUserId(authentication);
        boolean hasCredentials = contactService.hasGoogleCredentials(ownerId);
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasGoogleCredentials", hasCredentials);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncContacts(Authentication authentication) {
        UUID ownerId = currentUserId(authentication);
        contactService.syncGoogleContacts(ownerId);
        return ResponseEntity.ok("Contacts synced successfully.");
    }

    @PostMapping
    public ResponseEntity<UserContactResponseDto> addContact(
            @RequestBody AddContactRequest request,
            Authentication authentication) {
        UUID ownerId = currentUserId(authentication);
        UserContactResponseDto response = contactService.addContact(ownerId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserContactResponseDto>> searchContacts(
            @RequestParam String query,
            Authentication authentication) {
        UUID ownerId = currentUserId(authentication);
        List<UserContactResponseDto> results = contactService.searchContacts(ownerId, query);
        return ResponseEntity.ok(results);
    }

    private UUID currentUserId(Authentication authentication) {
        String identifier = authentication.getName().trim();
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found for the current session. Please sign in again."))
                .getId();
    }

}
