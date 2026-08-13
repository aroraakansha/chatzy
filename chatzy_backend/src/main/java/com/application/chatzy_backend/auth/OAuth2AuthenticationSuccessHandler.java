package com.application.chatzy_backend.auth;

import com.application.chatzy_backend.googlecontactsaccess.GoogleCredential;
import com.application.chatzy_backend.googlecontactsaccess.GoogleCredentialRepository;
import com.application.chatzy_backend.security.JwtUtils;
import com.application.chatzy_backend.user.User;
import com.application.chatzy_backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final GoogleCredentialRepository googleCredentialRepository;
    private final OAuth2AuthorizedClientService authorizedClientService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication)throws IOException, jakarta.servlet.ServletException {

        logger.info("=== OAuth2 Authentication Success Handler Started ===");
        logger.info("Authentication type: {}", authentication.getClass().getName());

        // 1. Ensure we are dealing with an OAuth2 login
        if (!(authentication instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken)) {
            logger.warn("Not an OAuth2 token, delegating to parent handler");
            super.onAuthenticationSuccess(request, response, authentication);
            return;
        }

        org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken oauthToken =
                (org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken) authentication;

        OAuth2User oAuth2User = oauthToken.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        logger.info("OAuth2 User Email: {}", email);

        // 2. Get or create the user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            logger.info("Creating new user for email: {}", email);
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email.split("@")[0]);
            newUser.setDisplayName(oAuth2User.getAttribute("name"));
            newUser.setAvatarUrl(oAuth2User.getAttribute("picture"));
            newUser.setPasswordHash("");
            newUser.setCreatedAt(OffsetDateTime.now());
            return userRepository.save(newUser);
        });
        logger.info("User ID: {}, Email: {}", user.getId(), user.getEmail());

        // 3. Load the authorized client
        logger.info("Loading authorized client with registration ID: {}", oauthToken.getAuthorizedClientRegistrationId());
        OAuth2AuthorizedClient authorizedClient = authorizedClientService.loadAuthorizedClient(
                oauthToken.getAuthorizedClientRegistrationId(),
                oauthToken.getName()
        );

        if (authorizedClient != null && authorizedClient.getAccessToken() != null) {
            logger.info("✅ Authorized client found with access token");
            String accessToken = authorizedClient.getAccessToken().getTokenValue();
            String refreshToken = (authorizedClient.getRefreshToken() != null)
                    ? authorizedClient.getRefreshToken().getTokenValue() : null;

            OffsetDateTime expiresAt = authorizedClient.getAccessToken().getExpiresAt() != null
                    ? authorizedClient.getAccessToken().getExpiresAt().atOffset(java.time.ZoneOffset.UTC)
                    : OffsetDateTime.now().plusHours(1);

            logger.info("Access Token (first 20 chars): {}", accessToken.substring(0, Math.min(20, accessToken.length())));
            logger.info("Refresh Token present: {}", refreshToken != null);
            logger.info("Token expires at: {}", expiresAt);

            // 4. Save/Update credentials
            GoogleCredential credential = googleCredentialRepository.findById(user.getId())
                    .orElse(new GoogleCredential());
            credential.setUserId(user.getId());
            credential.setAccessToken(accessToken);
            credential.setRefreshToken(refreshToken);
            credential.setAccessTokenExpiresAt(expiresAt);
            googleCredentialRepository.save(credential);
            logger.info("✅ Google credentials saved to database for user: {}", user.getId());

            // Update user entity
            user.setGoogleAccessToken(accessToken);
            user.setGoogleRefreshToken(refreshToken);
            user.setTokenExpiryAt(expiresAt);
            userRepository.save(user);
            logger.info("✅ User entity updated with Google tokens");
        } else {
            logger.error("❌ Authorized client is NULL or access token is NULL for user: {}", email);
            logger.error("AuthorizedClient: {}", authorizedClient);
            if (authorizedClient != null) {
                logger.error("Access Token: {}", authorizedClient.getAccessToken());
            }
        }

        // 5. Generate JWT and redirect
        String jwt = jwtUtils.generateToken(email);
        logger.info("✅ JWT generated for user: {}", email);
        
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/google-success")
                .queryParam("token", jwt)
                .build().toUriString();

        logger.info("Redirecting to: {}", targetUrl);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
        logger.info("=== OAuth2 Authentication Success Handler Completed ===");
    }
}