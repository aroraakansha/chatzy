package com.application.chatzy_backend.googlecontactsaccess;

import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.auth.oauth2.GoogleRefreshTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.people.v1.PeopleService;
import com.google.api.services.people.v1.model.Person;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GooglePeopleClient {

    private final UserRepository userRepository;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    public List<Person> fetchGoogleContacts(String accessToken) throws IOException {
        GoogleCredential credential = new GoogleCredential().setAccessToken(accessToken);
        PeopleService service = new PeopleService.Builder(new NetHttpTransport(), new GsonFactory(), credential)
                .setApplicationName("Chatzy")
                .build();

        var response = service.people().connections()
                .list("people/me")
                .setPersonFields("names,emailAddresses,phoneNumbers")
                .execute();

        return response.getConnections() != null ? response.getConnections() : Collections.emptyList();
    }

    public String getValidAccessToken(User user) throws IOException {
        if (user.getTokenExpiryAt() == null || user.getTokenExpiryAt().isBefore(OffsetDateTime.now())) {

            // Use GoogleRefreshTokenRequest instead of GoogleAuthorizationCodeTokenRequest
            GoogleTokenResponse tokenResponse = new GoogleRefreshTokenRequest(
                    new NetHttpTransport(),
                    new GsonFactory(),
                    user.getGoogleRefreshToken(), // The refresh token
                    clientId,
                    clientSecret
            ).execute();

            String newAccessToken = tokenResponse.getAccessToken();

            // Update User record using the correct Lombok-generated setters
            user.setGoogleAccessToken(newAccessToken);
            user.setTokenExpiryAt(OffsetDateTime.now().plusSeconds(tokenResponse.getExpiresInSeconds()));

            // Save to DB
            userRepository.save(user);

            return newAccessToken;
        }
        return user.getGoogleAccessToken();
    }
}